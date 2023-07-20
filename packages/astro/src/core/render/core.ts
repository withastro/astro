import type {
	AstroCookies,
	ComponentInstance,
	MiddlewareHandler,
	MiddlewareResponseHandler,
	RouteType,
} from '../../@types/astro';
import { renderPage as runtimeRenderPage } from '../../runtime/server/index.js';
import { attachToResponse } from '../cookies/index.js';
import { callEndpoint, createAPIContext, type EndpointCallResult } from '../endpoint/index.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import { redirectRouteGenerate, redirectRouteStatus, routeIsRedirect } from '../redirects/index.js';
import type { RenderContext } from './context.js';
import type { Environment } from './environment.js';
import { createResult } from './result.js';
import type { EndpointHandler } from '../../@types/astro';

export type RenderPage = {
	mod: ComponentInstance;
	renderContext: RenderContext;
	env: Environment;
	cookies: AstroCookies;
};

async function renderPage({ mod, renderContext, env, cookies }: RenderPage) {
	if (routeIsRedirect(renderContext.route)) {
		return new Response(null, {
			status: redirectRouteStatus(renderContext.route, renderContext.request.method),
			headers: {
				location: redirectRouteGenerate(renderContext.route, renderContext.params),
			},
		});
	}

	// Validate the page component before rendering the page
	const Component = mod.default;
	if (!Component)
		throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);

	const result = createResult({
		adapterName: env.adapterName,
		links: renderContext.links,
		styles: renderContext.styles,
		logging: env.logging,
		markdown: env.markdown,
		params: renderContext.params,
		pathname: renderContext.pathname,
		componentMetadata: renderContext.componentMetadata,
		resolve: env.resolve,
		renderers: env.renderers,
		clientDirectives: env.clientDirectives,
		compressHTML: env.compressHTML,
		request: renderContext.request,
		site: env.site,
		scripts: renderContext.scripts,
		ssr: env.ssr,
		status: renderContext.status ?? 200,
		cookies,
		locals: renderContext.locals ?? {},
	});

	// Support `export const components` for `MDX` pages
	if (typeof (mod as any).components === 'object') {
		Object.assign(renderContext.props, { components: (mod as any).components });
	}

	let response = await runtimeRenderPage(
		result,
		Component,
		renderContext.props,
		null,
		env.streaming,
		renderContext.route
	);

	// If there is an Astro.cookies instance, attach it to the response so that
	// adapters can grab the Set-Cookie headers.
	if (result.cookies) {
		attachToResponse(response, result.cookies);
	}

	return response;
}

/**
 * It attempts to render a route. A route can be a:
 * - page
 * - redirect
 * - endpoint
 *
 * ## Errors
 *
 * It throws an error if the page can't be rendered.
 */
export async function tryRenderRoute<MiddlewareReturnType = Response>(
	routeType: RouteType,
	renderContext: Readonly<RenderContext>,
	env: Readonly<Environment>,
	mod: Readonly<ComponentInstance>,
	onRequest?: MiddlewareHandler<MiddlewareReturnType>
): Promise<Response | EndpointCallResult> {
	const apiContext = createAPIContext({
		request: renderContext.request,
		params: renderContext.params,
		props: renderContext.props,
		site: env.site,
		adapterName: env.adapterName,
	});

	switch (routeType) {
		case 'page':
		case 'redirect': {
			if (onRequest) {
				return await callMiddleware<Response>(
					env.logging,
					onRequest as MiddlewareResponseHandler,
					apiContext,
					() => {
						return renderPage({
							mod,
							renderContext,
							env,
							cookies: apiContext.cookies,
						});
					}
				);
			} else {
				return await renderPage({
					mod,
					renderContext,
					env,
					cookies: apiContext.cookies,
				});
			}
		}
		case 'endpoint': {
			const result = await callEndpoint(
				mod as any as EndpointHandler,
				env,
				renderContext,
				onRequest
			);
			return result;
		}
		default:
			throw new Error(`Couldn't find route of type [${routeType}]`);
	}
}

export function isEndpointResult(result: any, routeType: RouteType): result is EndpointCallResult {
	return !(result instanceof Response) && routeType === 'endpoint';
}

export function isResponse(result: any, routeType: RouteType): result is Response {
	return result instanceof Response && (routeType === 'page' || routeType === 'redirect');
}
