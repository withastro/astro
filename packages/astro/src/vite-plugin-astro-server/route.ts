import mime from 'mime';
import type http from 'node:http';
import type {
	ComponentInstance,
	ManifestData,
	MiddlewareResponseHandler,
	RouteData,
	SSRElement,
	SSRManifest,
} from '../@types/astro';
import { attachToResponse } from '../core/cookies/index.js';
import { AstroErrorData, isAstroError } from '../core/errors/index.js';
import { warn } from '../core/logger/core.js';
import { loadMiddleware } from '../core/middleware/loadMiddleware.js';
import { isEndpointResult } from '../core/render/core.js';
import {
	createRenderContext,
	getParamsAndProps,
	tryRenderRoute,
	type DevelopmentEnvironment,
	type SSROptions,
} from '../core/render/index.js';
import { createRequest } from '../core/request.js';
import { matchAllRoutes } from '../core/routing/index.js';
import { isPage, resolveIdToUrl, viteID } from '../core/util.js';
import { getSortedPreloadedMatches } from '../prerender/routing.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';
import { log404 } from './common.js';
import { getStylesForURL } from './css.js';
import { preload } from './index.js';
import { getComponentMetadata } from './metadata.js';
import { handle404Response, writeSSRResult, writeWebResponse } from './response.js';
import { getScriptsForURL } from './scripts.js';

const clientLocalsSymbol = Symbol.for('astro.locals');

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

export interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
	preloadedComponent: ComponentInstance;
	mod: ComponentInstance;
}

function getCustom404Route(manifest: ManifestData): RouteData | undefined {
	const route404 = /^\/404\/?$/;
	return manifest.routes.find((r) => route404.test(r.route));
}

export async function matchRoute(
	pathname: string,
	env: DevelopmentEnvironment,
	manifest: ManifestData
): Promise<MatchedRoute | undefined> {
	const { logging, settings, routeCache } = env;
	const matches = matchAllRoutes(pathname, manifest);
	const preloadedMatches = await getSortedPreloadedMatches({ env, matches, settings });

	for await (const { preloadedComponent, route: maybeRoute, filePath } of preloadedMatches) {
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		try {
			await getParamsAndProps({
				mod: preloadedComponent,
				route: maybeRoute,
				routeCache,
				pathname: pathname,
				logging,
				ssr: isServerLikeOutput(settings.config),
			});
			return {
				route: maybeRoute,
				filePath,
				resolvedPathname: pathname,
				preloadedComponent,
				mod: preloadedComponent,
			};
		} catch (e) {
			// Ignore error for no matching static paths
			if (isAstroError(e) && e.title === AstroErrorData.NoMatchingStaticPathFound.title) {
				continue;
			}
			throw e;
		}
	}

	// Try without `.html` extensions or `index.html` in request URLs to mimic
	// routing behavior in production builds. This supports both file and directory
	// build formats, and is necessary based on how the manifest tracks build targets.
	const altPathname = pathname.replace(/(index)?\.html$/, '');
	if (altPathname !== pathname) {
		return await matchRoute(altPathname, env, manifest);
	}

	if (matches.length) {
		const possibleRoutes = matches.flatMap((route) => route.component);

		warn(
			logging,
			'getStaticPaths',
			`${AstroErrorData.NoMatchingStaticPathFound.message(
				pathname
			)}\n\n${AstroErrorData.NoMatchingStaticPathFound.hint(possibleRoutes)}`
		);
	}

	log404(logging, pathname);
	const custom404 = getCustom404Route(manifest);

	if (custom404) {
		const filePath = new URL(`./${custom404.component}`, settings.config.root);
		const preloadedComponent = await preload({ env, filePath });

		return {
			route: custom404,
			filePath,
			resolvedPathname: pathname,
			preloadedComponent,
			mod: preloadedComponent,
		};
	}

	return undefined;
}

type HandleRoute = {
	matchedRoute: AsyncReturnType<typeof matchRoute>;
	url: URL;
	pathname: string;
	body: ArrayBuffer | undefined;
	origin: string;
	env: DevelopmentEnvironment;
	manifestData: ManifestData;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
	manifest: SSRManifest;
	status?: 404 | 500;
};

export async function handleRoute({
	matchedRoute,
	url,
	pathname,
	status = getStatus(matchedRoute),
	body,
	origin,
	env,
	manifestData,
	incomingRequest,
	incomingResponse,
	manifest,
}: HandleRoute): Promise<void> {
	const { logging, settings } = env;
	if (!matchedRoute) {
		return handle404Response(origin, incomingRequest, incomingResponse);
	}

	const { config } = settings;
	const filePath: URL | undefined = matchedRoute.filePath;
	const { route, preloadedComponent } = matchedRoute;
	const buildingToSSR = isServerLikeOutput(config);

	// Headers are only available when using SSR.
	const request = createRequest({
		url,
		headers: buildingToSSR ? incomingRequest.headers : new Headers(),
		method: incomingRequest.method,
		body,
		logging,
		ssr: buildingToSSR,
		clientAddress: buildingToSSR ? incomingRequest.socket.remoteAddress : undefined,
		locals: Reflect.get(incomingRequest, clientLocalsSymbol), // Allows adapters to pass in locals in dev mode.
	});

	// Set user specified headers to response object.
	for (const [name, value] of Object.entries(config.server.headers ?? {})) {
		if (value) incomingResponse.setHeader(name, value);
	}

	const options: SSROptions = {
		env,
		filePath,
		preload: preloadedComponent,
		pathname,
		request,
		route,
	};
	const middleware = await loadMiddleware(env.loader, env.settings.config.srcDir);
	if (middleware) {
		options.middleware = middleware;
	}
	const mod = options.preload;

	const { scripts, links, styles, metadata } = await getScriptsAndStyles({
		env: options.env,
		filePath: options.filePath,
	});

	const renderContext = await createRenderContext({
		request: options.request,
		pathname: options.pathname,
		scripts,
		links,
		styles,
		componentMetadata: metadata,
		route: options.route,
		mod,
		env,
	});
	const onRequest = options.middleware?.onRequest as MiddlewareResponseHandler | undefined;

	const result = await tryRenderRoute(route.type, renderContext, env, mod, onRequest);
	if (isEndpointResult(result, route.type)) {
		if (result.type === 'response') {
			if (result.response.headers.get('X-Astro-Response') === 'Not-Found') {
				const fourOhFourRoute = await matchRoute('/404', env, manifestData);
				return handleRoute({
					matchedRoute: fourOhFourRoute,
					url: new URL('/404', url),
					pathname: '/404',
					status: 404,
					body,
					origin,
					env,
					manifestData,
					incomingRequest,
					incomingResponse,
					manifest,
				});
			}
			await writeWebResponse(incomingResponse, result.response);
		} else {
			let contentType = 'text/plain';
			// Dynamic routes don't include `route.pathname`, so synthesize a path for these (e.g. 'src/pages/[slug].svg')
			const filepath =
				route.pathname ||
				route.segments.map((segment) => segment.map((p) => p.content).join('')).join('/');
			const computedMimeType = mime.getType(filepath);
			if (computedMimeType) {
				contentType = computedMimeType;
			}
			const response = new Response(Buffer.from(result.body, result.encoding), {
				status: 200,
				headers: {
					'Content-Type': `${contentType};charset=utf-8`,
				},
			});
			attachToResponse(response, result.cookies);
			await writeWebResponse(incomingResponse, response);
		}
	} else {
		if (result.status === 404) {
			const fourOhFourRoute = await matchRoute('/404', env, manifestData);
			return handleRoute({
				...options,
				matchedRoute: fourOhFourRoute,
				url: new URL(pathname, url),
				status: 404,
				body,
				origin,
				env,
				manifestData,
				incomingRequest,
				incomingResponse,
				manifest,
			});
		}

		let response = result;

		if (
			// We are in a recursion, and it's possible that this function is called itself with a status code
			// By default, the status code passed via parameters is computed by the matched route.
			//
			// By default, we should give priority to the status code passed, although it's possible that
			// the `Response` emitted by the user is a redirect. If so, then return the returned response.
			response.status < 400 &&
			response.status >= 300
		) {
			await writeSSRResult(request, response, incomingResponse);
			return;
		} else if (status && response.status !== status && (status === 404 || status === 500)) {
			// Response.status is read-only, so a clone is required to override
			response = new Response(result.body, { ...result, status });
		}
		await writeSSRResult(request, response, incomingResponse);
	}
}

interface GetScriptsAndStylesParams {
	env: DevelopmentEnvironment;
	filePath: URL;
}

async function getScriptsAndStyles({ env, filePath }: GetScriptsAndStylesParams) {
	// Add hoisted script tags
	const scripts = await getScriptsForURL(filePath, env.settings.config.root, env.loader);

	// Inject HMR scripts
	if (isPage(filePath, env.settings) && env.mode === 'development') {
		scripts.add({
			props: { type: 'module', src: '/@vite/client' },
			children: '',
		});
		scripts.add({
			props: {
				type: 'module',
				src: await resolveIdToUrl(env.loader, 'astro/runtime/client/hmr.js'),
			},
			children: '',
		});
	}

	// TODO: We should allow adding generic HTML elements to the head, not just scripts
	for (const script of env.settings.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		} else if (script.stage === 'page' && isPage(filePath, env.settings)) {
			scripts.add({
				props: { type: 'module', src: `/@id/${PAGE_SCRIPT_ID}` },
				children: '',
			});
		}
	}

	// Pass framework CSS in as style tags to be appended to the page.
	const { urls: styleUrls, stylesMap } = await getStylesForURL(filePath, env.loader, env.mode);
	let links = new Set<SSRElement>();
	[...styleUrls].forEach((href) => {
		links.add({
			props: {
				rel: 'stylesheet',
				href,
			},
			children: '',
		});
	});

	let styles = new Set<SSRElement>();
	[...stylesMap].forEach(([url, content]) => {
		// Vite handles HMR for styles injected as scripts
		scripts.add({
			props: {
				type: 'module',
				src: url,
			},
			children: '',
		});
		// But we still want to inject the styles to avoid FOUC
		styles.add({
			props: {
				type: 'text/css',
				// Track the ID so we can match it to Vite's injected style later
				'data-astro-dev-id': viteID(new URL(`.${url}`, env.settings.config.root)),
			},
			children: content,
		});
	});

	const metadata = await getComponentMetadata(filePath, env.loader);

	return { scripts, styles, links, metadata };
}

function getStatus(matchedRoute?: MatchedRoute): 404 | 500 | undefined {
	if (!matchedRoute) return 404;
	if (matchedRoute.route.route === '/404') return 404;
	if (matchedRoute.route.route === '/500') return 500;
}
