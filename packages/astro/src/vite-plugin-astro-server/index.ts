import type http from 'http';
import mime from 'mime';
import type * as vite from 'vite';
import type { AstroConfig, AstroSettings, ManifestData } from '../@types/astro';
import { DevelopmentEnvironment, SSROptions } from '../core/render/dev/index';

import { Readable } from 'stream';
import { attachToResponse, getSetCookiesFromResponse } from '../core/cookies/index.js';
import { call as callEndpoint } from '../core/endpoint/dev/index.js';
import { collectErrorMetadata, getViteErrorPayload } from '../core/errors/dev/index.js';
import type { ErrorWithMetadata } from '../core/errors/index.js';
import { createSafeError } from '../core/errors/index.js';
import { error, info, LogOptions, warn } from '../core/logger/core.js';
import * as msg from '../core/messages.js';
import { appendForwardSlash } from '../core/path.js';
import { createDevelopmentEnvironment, preload, renderPage } from '../core/render/dev/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../core/render/index.js';
import { createRequest } from '../core/request.js';
import { createRouteManifest, matchAllRoutes } from '../core/routing/index.js';
import { resolvePages } from '../core/util.js';
import notFoundTemplate, { subpathNotUsedTemplate } from '../template/4xx.js';
import { throwIfRedirectNotAllowed } from '../core/endpoint/index.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

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

	// Attach any set-cookie headers added via Astro.cookies.set()
	const setCookieHeaders = Array.from(getSetCookiesFromResponse(webResponse));
	if (setCookieHeaders.length) {
		res.setHeader('Set-Cookie', setCookieHeaders);
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
		res.write(`<script type="module" src="/@vite/client"></script>`);
		res.end();
	} else {
		writeHtmlResponse(
			res,
			500,
			`<title>${err.name}</title><script type="module" src="/@vite/client"></script>`
		);
	}
}

function getCustom404Route({ config }: AstroSettings, manifest: ManifestData) {
	// For Windows compat, use relative page paths to match the 404 route
	const relPages = resolvePages(config).href.replace(config.root.href, '');
	const pattern = new RegExp(`${appendForwardSlash(relPages)}404.(astro|md)`);
	return manifest.routes.find((r) => r.component.match(pattern));
}

function log404(logging: LogOptions, pathname: string) {
	info(logging, 'serve', msg.req({ url: pathname, statusCode: 404 }));
}

export function baseMiddleware(
	settings: AstroSettings,
	logging: LogOptions
): vite.Connect.NextHandleFunction {
	const { config } = settings;
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

async function matchRoute(pathname: string, env: DevelopmentEnvironment, manifest: ManifestData) {
	const { logging, settings, routeCache } = env;
	const matches = matchAllRoutes(pathname, manifest);

	for await (const maybeRoute of matches) {
		const filePath = new URL(`./${maybeRoute.component}`, settings.config.root);
		const preloadedComponent = await preload({ env, filePath });
		const [, mod] = preloadedComponent;
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		const paramsAndPropsRes = await getParamsAndProps({
			mod,
			route: maybeRoute,
			routeCache,
			pathname: pathname,
			logging,
			ssr: settings.config.output === 'server',
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
	const custom404 = getCustom404Route(settings, manifest);

	if (custom404) {
		const filePath = new URL(`./${custom404.component}`, settings.config.root);
		const preloadedComponent = await preload({ env, filePath });
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

/** The main logic to route dev server requests to pages in Astro. */
async function handleRequest(
	env: DevelopmentEnvironment,
	manifest: ManifestData,
	req: http.IncomingMessage,
	res: http.ServerResponse
) {
	const { settings, viteServer } = env;
	const { config } = settings;
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
		let bytes: Uint8Array[] = [];
		await new Promise((resolve) => {
			req.on('data', (part) => {
				bytes.push(part);
			});
			req.on('end', resolve);
		});
		body = Buffer.concat(bytes);
	}

	try {
		const matchedRoute = await matchRoute(pathname, env, manifest);
		return await handleRoute(matchedRoute, url, pathname, body, origin, env, manifest, req, res);
	} catch (_err) {
		// This is our last line of defense regarding errors where we still might have some information about the request
		// Our error should already be complete, but let's try to add a bit more through some guesswork
		const err = createSafeError(_err);
		const errorWithMetadata = collectErrorMetadata(err);

		error(env.logging, null, msg.formatErrorMessage(errorWithMetadata));
		handle500Response(viteServer, origin, req, res, errorWithMetadata);
	}
}

async function handleRoute(
	matchedRoute: AsyncReturnType<typeof matchRoute>,
	url: URL,
	pathname: string,
	body: ArrayBuffer | undefined,
	origin: string,
	env: DevelopmentEnvironment,
	manifest: ManifestData,
	req: http.IncomingMessage,
	res: http.ServerResponse
): Promise<void> {
	const { logging, settings } = env;
	if (!matchedRoute) {
		return handle404Response(origin, req, res);
	}

	const { config } = settings;
	const filePath: URL | undefined = matchedRoute.filePath;
	const { route, preloadedComponent, mod } = matchedRoute;
	const buildingToSSR = config.output === 'server';

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

	// attempt to get static paths
	// if this fails, we have a bad URL match!
	const paramsAndPropsRes = await getParamsAndProps({
		mod,
		route,
		routeCache: env.routeCache,
		pathname: pathname,
		logging,
		ssr: config.output === 'server',
	});

	const options: SSROptions = {
		env,
		filePath,
		origin,
		preload: preloadedComponent,
		pathname,
		request,
		route,
	};

	// Route successfully matched! Render it.
	if (route.type === 'endpoint') {
		const result = await callEndpoint(options);
		if (result.type === 'response') {
			if (result.response.headers.get('X-Astro-Response') === 'Not-Found') {
				const fourOhFourRoute = await matchRoute('/404', env, manifest);
				return handleRoute(
					fourOhFourRoute,
					new URL('/404', url),
					'/404',
					body,
					origin,
					env,
					manifest,
					req,
					res
				);
			}
			throwIfRedirectNotAllowed(result.response, config);
			await writeWebResponse(res, result.response);
		} else {
			let contentType = 'text/plain';
			// Dynamic routes don’t include `route.pathname`, so synthesize a path for these (e.g. 'src/pages/[slug].svg')
			const filepath =
				route.pathname ||
				route.segments.map((segment) => segment.map((p) => p.content).join('')).join('/');
			const computedMimeType = mime.getType(filepath);
			if (computedMimeType) {
				contentType = computedMimeType;
			}
			const response = new Response(result.body, {
				status: 200,
				headers: {
					'Content-Type': `${contentType};charset=utf-8`,
				},
			});
			attachToResponse(response, result.cookies);
			await writeWebResponse(res, response);
		}
	} else {
		const result = await renderPage(options);
		throwIfRedirectNotAllowed(result, config);
		return await writeSSRResult(result, res);
	}
}

export default function createPlugin({ settings, logging }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		configureServer(viteServer) {
			let env = createDevelopmentEnvironment(settings, logging, viteServer);
			let manifest: ManifestData = createRouteManifest({ settings }, logging);

			/** rebuild the route cache + manifest, as needed. */
			function rebuildManifest(needsManifestRebuild: boolean, file: string) {
				env.routeCache.clearAll();
				if (needsManifestRebuild) {
					manifest = createRouteManifest({ settings }, logging);
				}
			}
			// Rebuild route manifest on file change, if needed.
			viteServer.watcher.on('add', rebuildManifest.bind(null, true));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, true));
			viteServer.watcher.on('change', rebuildManifest.bind(null, false));
			return () => {
				// Push this middleware to the front of the stack so that it can intercept responses.
				if (settings.config.base !== '/') {
					viteServer.middlewares.stack.unshift({
						route: '',
						handle: baseMiddleware(settings, logging),
					});
				}
				viteServer.middlewares.use(async (req, res) => {
					if (!req.url || !req.method) {
						throw new Error('Incomplete request');
					}
					handleRequest(env, manifest, req, res);
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
