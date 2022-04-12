import type * as vite from 'vite';
import type http from 'http';
import type { AstroConfig, ManifestData } from '../@types/astro';
import type { RenderResponse, SSROptions } from '../core/render/dev/index';
import { debug, info, warn, error, LogOptions } from '../core/logger/core.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../core/render/core.js';
import { createRouteManifest, matchRoute } from '../core/routing/index.js';
import stripAnsi from 'strip-ansi';
import { createSafeError, resolvePages, isBuildingToSSR } from '../core/util.js';
import { ssr, preload } from '../core/render/dev/index.js';
import { call as callEndpoint } from '../core/endpoint/dev/index.js';
import * as msg from '../core/messages.js';
import notFoundTemplate, { subpathNotUsedTemplate } from '../template/4xx.js';
import serverErrorTemplate from '../template/5xx.js';
import { RouteCache } from '../core/render/route-cache.js';
import { fixViteErrorMessage } from '../core/errors.js';
import { createRequest } from '../core/request.js';
import { Readable } from 'stream';

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
		if (body instanceof Readable) {
			body.pipe(res);
			return;
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

async function writeSSRResult(
	result: RenderResponse,
	res: http.ServerResponse,
	statusCode: 200 | 404
) {
	if (result.type === 'response') {
		const { response } = result;
		await writeWebResponse(res, response);
		return;
	}

	const { html } = result;
	writeHtmlResponse(res, statusCode, html);
}

async function handle404Response(
	origin: string,
	config: AstroConfig,
	req: http.IncomingMessage,
	res: http.ServerResponse
) {
	const site = config.site ? new URL(config.base, config.site) : undefined;
	const devRoot = site ? site.pathname : '/';
	const pathname = decodeURI(new URL(origin + req.url).pathname);
	let html = '';
	if (pathname === '/' && !pathname.startsWith(devRoot)) {
		html = subpathNotUsedTemplate(devRoot, pathname);
	} else {
		html = notFoundTemplate({
			statusCode: 404,
			title: 'Not found',
			tabTitle: '404: Not Found',
			pathname,
		});
	}
	writeHtmlResponse(res, 404, html);
}

async function handle500Response(
	viteServer: vite.ViteDevServer,
	origin: string,
	req: http.IncomingMessage,
	res: http.ServerResponse,
	err: any
) {
	const pathname = decodeURI(new URL(origin + req.url).pathname);
	const html = serverErrorTemplate({
		statusCode: 500,
		title: 'Internal Error',
		tabTitle: '500: Error',
		message: stripAnsi(err.message),
		url: err.url || undefined,
		stack: stripAnsi(err.stack),
	});
	const transformedHtml = await viteServer.transformIndexHtml(pathname, html, pathname);
	writeHtmlResponse(res, 500, transformedHtml);
}

function getCustom404Route(config: AstroConfig, manifest: ManifestData) {
	const relPages = resolvePages(config).href.replace(config.root.href, '');
	return manifest.routes.find((r) => r.component === relPages + '404.astro');
}

function log404(logging: LogOptions, pathname: string) {
	info(logging, 'serve', msg.req({ url: pathname, statusCode: 404 }));
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
	const site = config.site ? new URL(config.base, config.site) : undefined;
	const devRoot = site ? site.pathname : '/';
	const origin = `${viteServer.config.server.https ? 'https' : 'http'}://${req.headers.host}`;
	const buildingToSSR = isBuildingToSSR(config);
	const url = new URL(origin + req.url);
	const pathname = decodeURI(url.pathname);
	const rootRelativeUrl = pathname.substring(devRoot.length - 1);
	if (!buildingToSSR) {
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
	});

	try {
		if (!pathname.startsWith(devRoot)) {
			log404(logging, pathname);
			return handle404Response(origin, config, req, res);
		}
		// Attempt to match the URL to a valid page route.
		// If that fails, switch the response to a 404 response.
		let route = matchRoute(rootRelativeUrl, manifest);
		const statusCode = route ? 200 : 404;

		if (!route) {
			log404(logging, pathname);
			const custom404 = getCustom404Route(config, manifest);
			if (custom404) {
				route = custom404;
			} else {
				return handle404Response(origin, config, req, res);
			}
		}

		const filePath = new URL(`./${route.component}`, config.root);
		const preloadedComponent = await preload({ astroConfig: config, filePath, viteServer });
		const [, mod] = preloadedComponent;
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		const paramsAndPropsRes = await getParamsAndProps({
			mod,
			route,
			routeCache,
			pathname: rootRelativeUrl,
			logging,
			ssr: isBuildingToSSR(config),
		});
		if (paramsAndPropsRes === GetParamsAndPropsError.NoMatchingStaticPath) {
			warn(
				logging,
				'getStaticPaths',
				`Route pattern matched, but no matching static path found. (${pathname})`
			);
			log404(logging, pathname);
			const routeCustom404 = getCustom404Route(config, manifest);
			if (routeCustom404) {
				const filePathCustom404 = new URL(`./${routeCustom404.component}`, config.root);
				const preloadedCompCustom404 = await preload({
					astroConfig: config,
					filePath: filePathCustom404,
					viteServer,
				});
				const result = await ssr(preloadedCompCustom404, {
					astroConfig: config,
					filePath: filePathCustom404,
					logging,
					mode: 'development',
					origin,
					pathname: rootRelativeUrl,
					request,
					route: routeCustom404,
					routeCache,
					viteServer,
				});
				return await writeSSRResult(result, res, statusCode);
			} else {
				return handle404Response(origin, config, req, res);
			}
		}

		const options: SSROptions = {
			astroConfig: config,
			filePath,
			logging,
			mode: 'development',
			origin,
			pathname: rootRelativeUrl,
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
				res.writeHead(200);
				res.end(result.body);
			}
		} else {
			const result = await ssr(preloadedComponent, options);
			return await writeSSRResult(result, res, statusCode);
		}
	} catch (_err) {
		debugger;
		const err = fixViteErrorMessage(createSafeError(_err), viteServer);
		error(logging, null, msg.formatErrorMessage(err));
		handle500Response(viteServer, origin, req, res, err);
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
				viteServer.middlewares.use(async (req, res) => {
					if (!req.url || !req.method) {
						throw new Error('Incomplete request');
					}
					handleRequest(routeCache, viteServer, logging, manifest, config, req, res);
				});
			};
		},
	};
}
