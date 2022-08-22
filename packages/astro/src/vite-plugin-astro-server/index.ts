import type http from 'http';
import mime from 'mime';
import type * as vite from 'vite';
import type { AstroConfig, ManifestData } from '../@types/astro';
import type { SSROptions } from '../core/render/dev/index';

import { Readable } from 'stream';
import { call as callEndpoint } from '../core/endpoint/dev/index.js';
import {
	collectErrorMetadata,
	ErrorWithMetadata,
	fixViteErrorMessage,
	getViteErrorPayload,
} from '../core/errors.js';
import { error, info, LogOptions, warn } from '../core/logger/core.js';
import * as msg from '../core/messages.js';
import { appendForwardSlash } from '../core/path.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../core/render/core.js';
import { preload, ssr } from '../core/render/dev/index.js';
import { RouteCache } from '../core/render/route-cache.js';
import { createRequest } from '../core/request.js';
import { createRouteManifest, matchAllRoutes } from '../core/routing/index.js';
import { createSafeError, resolvePages } from '../core/util.js';
import notFoundTemplate, { subpathNotUsedTemplate } from '../template/4xx.js';

interface AstroPluginOptions {
	config: AstroConfig;
	logging: LogOptions;
}

const BAD_VITE_MIDDLEWARE = [
	'viteIndexHtmlMiddleware',
	'vite404Middleware',
	'viteSpaFallbackMiddleware',
];
function removeViteHttpMiddleware(server: vite.Connect.Server) {
	for (let i = server.stack.length - 1; i > 0; i--) {
		// @ts-expect-error using internals until https://github.com/vitejs/vite/pull/4640 is merged
		if (BAD_VITE_MIDDLEWARE.includes(server.stack[i].handle.name)) {
			server.stack.splice(i, 1);
		}
	}
}

function truncateString(str: string, n: number) {
	if (str.length > n) {
		return str.substring(0, n) + '&#8230;';
	} else {
		return str;
	}
}

function writeHtmlResponse(res: http.ServerResponse, statusCode: number, html: string) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html; charset=utf-8',
		'Content-Length': Buffer.byteLength(html, 'utf-8'),
	});
	res.write(html);
	res.end();
}

async function writeWebResponse(res: http.ServerResponse, webResponse: Response) {
	const { status, headers, body } = webResponse;

	let _headers = {};
	if ('raw' in headers) {
		// Node fetch allows you to get the raw headers, which includes multiples of the same type.
		// This is needed because Set-Cookie *must* be called for each cookie, and can't be
		// concatenated together.
		type HeadersWithRaw = Headers & {
			raw: () => Record<string, string[]>;
		};

		for (const [key, value] of Object.entries((headers as HeadersWithRaw).raw())) {
			res.setHeader(key, value);
		}
	} else {
		_headers = Object.fromEntries(headers.entries());
	}

	res.writeHead(status, _headers);
	if (body) {
		if (Symbol.for('astro.responseBody') in webResponse) {
			let stream = (webResponse as any)[Symbol.for('astro.responseBody')];
			for await (const chunk of stream) {
				res.write(chunk.toString());
			}
		} else if (body instanceof Readable) {
			body.pipe(res);
			return;
		} else if (typeof body === 'string') {
			res.write(body);
		} else {
			const reader = body.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					res.write(value);
				}
			}
		}
	}
	res.end();
}

async function writeSSRResult(webResponse: Response, res: http.ServerResponse) {
	return writeWebResponse(res, webResponse);
}

async function handle404Response(
	origin: string,
	config: AstroConfig,
	req: http.IncomingMessage,
	res: http.ServerResponse
) {
	const pathname = decodeURI(new URL(origin + req.url).pathname);

	const html = notFoundTemplate({
		statusCode: 404,
		title: 'Not found',
		tabTitle: '404: Not Found',
		pathname,
	});
	writeHtmlResponse(res, 404, html);
}

async function handle500Response(
	viteServer: vite.ViteDevServer,
	origin: string,
	req: http.IncomingMessage,
	res: http.ServerResponse,
	err: ErrorWithMetadata
) {
	res.on('close', () => setTimeout(() => viteServer.ws.send(getViteErrorPayload(err)), 200));
	if (res.headersSent) {
		res.end();
	} else {
		writeHtmlResponse(
			res,
			500,
			`<title>${err.name}</title><script type="module" src="/@vite/client"></script>`
		);
	}
}

function getCustom404Route(config: AstroConfig, manifest: ManifestData) {
	// For Windows compat, use relative page paths to match the 404 route
	const relPages = resolvePages(config).href.replace(config.root.href, '');
	const pattern = new RegExp(`${appendForwardSlash(relPages)}404.(astro|md)`);
	return manifest.routes.find((r) => r.component.match(pattern));
}

function log404(logging: LogOptions, pathname: string) {
	info(logging, 'serve', msg.req({ url: pathname, statusCode: 404 }));
}

export function baseMiddleware(
	config: AstroConfig,
	logging: LogOptions
): vite.Connect.NextHandleFunction {
	const site = config.site ? new URL(config.base, config.site) : undefined;
	const devRoot = site ? site.pathname : '/';

	return function devBaseMiddleware(req, res, next) {
		const url = req.url!;

		const pathname = decodeURI(new URL(url, 'http://vitejs.dev').pathname);

		if (pathname.startsWith(devRoot)) {
			req.url = url.replace(devRoot, '/');
			return next();
		}

		if (pathname === '/' || pathname === '/index.html') {
			log404(logging, pathname);
			const html = subpathNotUsedTemplate(devRoot, pathname);
			return writeHtmlResponse(res, 404, html);
		}

		if (req.headers.accept?.includes('text/html')) {
			log404(logging, pathname);
			const html = notFoundTemplate({
				statusCode: 404,
				title: 'Not found',
				tabTitle: '404: Not Found',
				pathname,
			});
			return writeHtmlResponse(res, 404, html);
		}

		next();
	};
}

/** The main logic to route dev server requests to pages in Astro. */
async function handleRequest(
	routeCache: RouteCache,
	viteServer: vite.ViteDevServer,
	logging: LogOptions,
	manifest: ManifestData,
	config: AstroConfig,
	req: http.IncomingMessage,
	res: http.ServerResponse
) {
	const reqStart = performance.now();
	const origin = `${viteServer.config.server.https ? 'https' : 'http'}://${req.headers.host}`;
	const buildingToSSR = config.output === 'server';
	// Ignore `.html` extensions and `index.html` in request URLS to ensure that
	// routing behavior matches production builds. This supports both file and directory
	// build formats, and is necessary based on how the manifest tracks build targets.
	const url = new URL(origin + req.url?.replace(/(index)?\.html$/, ''));
	const pathname = decodeURI(url.pathname);

	// Add config.base back to url before passing it to SSR
	url.pathname = config.base.substring(0, config.base.length - 1) + url.pathname;

	// HACK! @astrojs/image uses query params for the injected route in `dev`
	if (!buildingToSSR && pathname !== '/_image') {
		// Prevent user from depending on search params when not doing SSR.
		// NOTE: Create an array copy here because deleting-while-iterating
		// creates bugs where not all search params are removed.
		const allSearchParams = Array.from(url.searchParams);
		for (const [key] of allSearchParams) {
			url.searchParams.delete(key);
		}
	}

	let body: ArrayBuffer | undefined = undefined;
	if (!(req.method === 'GET' || req.method === 'HEAD')) {
		let bytes: string[] = [];
		await new Promise((resolve) => {
			req.setEncoding('utf-8');
			req.on('data', (bts) => bytes.push(bts));
			req.on('end', resolve);
		});
		body = new TextEncoder().encode(bytes.join('')).buffer;
	}

	// Headers are only available when using SSR.
	const request = createRequest({
		url,
		headers: buildingToSSR ? req.headers : new Headers(),
		method: req.method,
		body,
		logging,
		ssr: buildingToSSR,
		clientAddress: buildingToSSR ? req.socket.remoteAddress : undefined,
	});

	async function matchRoute() {
		const matches = matchAllRoutes(pathname, manifest);

		for await (const maybeRoute of matches) {
			const filePath = new URL(`./${maybeRoute.component}`, config.root);
			const preloadedComponent = await preload({ astroConfig: config, filePath, viteServer });
			const [, mod] = preloadedComponent;
			// attempt to get static paths
			// if this fails, we have a bad URL match!
			const paramsAndPropsRes = await getParamsAndProps({
				mod,
				route: maybeRoute,
				routeCache,
				pathname: pathname,
				logging,
				ssr: config.output === 'server',
			});

			if (paramsAndPropsRes !== GetParamsAndPropsError.NoMatchingStaticPath) {
				return {
					route: maybeRoute,
					filePath,
					preloadedComponent,
					mod,
				};
			}
		}

		if (matches.length) {
			warn(
				logging,
				'getStaticPaths',
				`Route pattern matched, but no matching static path found. (${pathname})`
			);
		}

		log404(logging, pathname);
		const custom404 = getCustom404Route(config, manifest);

		if (custom404) {
			const filePath = new URL(`./${custom404.component}`, config.root);
			const preloadedComponent = await preload({ astroConfig: config, filePath, viteServer });
			const [, mod] = preloadedComponent;

			return {
				route: custom404,
				filePath,
				preloadedComponent,
				mod,
			};
		}

		return undefined;
	}

	let filePath: URL | undefined;
	try {
		const matchedRoute = await matchRoute();

		if (!matchedRoute) {
			return handle404Response(origin, config, req, res);
		}

		const { route, preloadedComponent, mod } = matchedRoute;
		filePath = matchedRoute.filePath;

		// attempt to get static paths
		// if this fails, we have a bad URL match!
		const paramsAndPropsRes = await getParamsAndProps({
			mod,
			route,
			routeCache,
			pathname: pathname,
			logging,
			ssr: config.output === 'server',
		});

		const options: SSROptions = {
			astroConfig: config,
			filePath,
			logging,
			mode: 'development',
			origin,
			pathname: pathname,
			route,
			routeCache,
			viteServer,
			request,
		};

		// Route successfully matched! Render it.
		if (route.type === 'endpoint') {
			const result = await callEndpoint(options);
			if (result.type === 'response') {
				await writeWebResponse(res, result.response);
			} else {
				let contentType = 'text/plain';
				// Dynamic routes don’t include `route.pathname`, so synthesise a path for these (e.g. 'src/pages/[slug].svg')
				const filepath =
					route.pathname ||
					route.segments.map((segment) => segment.map((p) => p.content).join('')).join('/');
				const computedMimeType = mime.getType(filepath);
				if (computedMimeType) {
					contentType = computedMimeType;
				}
				res.writeHead(200, { 'Content-Type': `${contentType};charset=utf-8` });
				res.end(result.body);
			}
		} else {
			const result = await ssr(preloadedComponent, options);
			return await writeSSRResult(result, res);
		}
	} catch (_err) {
		const err = fixViteErrorMessage(createSafeError(_err), viteServer, filePath);
		const errorWithMetadata = collectErrorMetadata(err);
		error(logging, null, msg.formatErrorMessage(errorWithMetadata));
		handle500Response(viteServer, origin, req, res, errorWithMetadata);
	}
}

export default function createPlugin({ config, logging }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		configureServer(viteServer) {
			let routeCache = new RouteCache(logging);
			let manifest: ManifestData = createRouteManifest({ config: config }, logging);
			/** rebuild the route cache + manifest, as needed. */
			function rebuildManifest(needsManifestRebuild: boolean, file: string) {
				routeCache.clearAll();
				if (needsManifestRebuild) {
					manifest = createRouteManifest({ config: config }, logging);
				}
			}
			// Rebuild route manifest on file change, if needed.
			viteServer.watcher.on('add', rebuildManifest.bind(null, true));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, true));
			viteServer.watcher.on('change', rebuildManifest.bind(null, false));
			return () => {
				removeViteHttpMiddleware(viteServer.middlewares);

				// Push this middleware to the front of the stack so that it can intercept responses.
				if (config.base !== '/') {
					viteServer.middlewares.stack.unshift({
						route: '',
						handle: baseMiddleware(config, logging),
					});
				}
				viteServer.middlewares.use(async (req, res) => {
					if (!req.url || !req.method) {
						throw new Error('Incomplete request');
					}
					handleRequest(routeCache, viteServer, logging, manifest, config, req, res);
				});
			};
		},
		// HACK: hide `.tip` in Vite's ErrorOverlay and replace [vite] messages with [astro]
		transform(code, id, opts = {}) {
			if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;
			return code
				.replace(/\.tip \{[^}]*\}/gm, '.tip {\n  display: none;\n}')
				.replace(/\[vite\]/g, '[astro]');
		},
	};
}
