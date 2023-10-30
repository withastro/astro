import type {
	AstroCookies,
	ComponentInstance,
	EndpointHandler,
	MiddlewareHandler,
	MiddlewareResponseHandler,
} from '../../@types/astro.js';
import { renderPage as runtimeRenderPage } from '../../runtime/server/index.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { callEndpoint, createAPIContext } from '../endpoint/index.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import { redirectRouteGenerate, redirectRouteStatus, routeIsRedirect } from '../redirects/index.js';
import type { RenderContext } from './context.js';
import type { Environment } from './environment.js';
import { createResult } from './result.js';
import { AstroError } from '../errors/index.js';
import { CantRenderPage } from '../errors/errors-data.js';
import { routeIsFallback } from '../redirects/helpers.js';

export type RenderPage = {
	mod: ComponentInstance | undefined;
	renderContext: RenderContext;
	env: Environment;
	cookies: AstroCookies;
};

export async function renderPage({ mod, renderContext, env, cookies }: RenderPage) {
	if (routeIsRedirect(renderContext.route)) {
		return new Response(null, {
			status: redirectRouteStatus(renderContext.route, renderContext.request.method),
			headers: {
				location: redirectRouteGenerate(renderContext.route, renderContext.params),
			},
		});
	} else if (routeIsFallback(renderContext.route)) {
		// We return a 404 because fallback routes don't exist.
		// It's responsibility of the middleware to catch them and re-route the requests
		return new Response(null, {
			status: 404,
		});
	} else if (!mod) {
		throw new AstroError(CantRenderPage);
	}

	// Validate the page component before rendering the page
	const Component = mod.default;
	if (!Component)
		throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);

	const result = createResult({
		adapterName: env.adapterName,
		links: renderContext.links,
		styles: renderContext.styles,
		logger: env.logger,
		params: renderContext.params,
		pathname: renderContext.pathname,
		componentMetadata: renderContext.componentMetadata,
		resolve: env.resolve,
		renderers: env.renderers,
		clientDirectives: env.clientDirectives,
		compressHTML: env.compressHTML,
		request: renderContext.request,
		partial: !!mod.partial,
		site: env.site,
		scripts: renderContext.scripts,
		ssr: env.ssr,
		status: renderContext.status ?? 200,
		cookies,
		locals: renderContext.locals ?? {},
		preferredLocale: renderContext.preferredLocale,
	});

	// TODO: Remove in Astro 4.0
	if (mod.frontmatter && typeof mod.frontmatter === 'object' && 'draft' in mod.frontmatter) {
		env.logger.warn(
			'astro',
			`The drafts feature is deprecated and used in ${renderContext.route.component}. You should migrate to content collections instead. See https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries for more information.`
		);
	}

	const response = await runtimeRenderPage(
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
		attachCookiesToResponse(response, result.cookies);
	}

	return response;
}
