import type { AstroCookies, ComponentInstance } from '../../@types/astro.js';
import { renderPage as runtimeRenderPage } from '../../runtime/server/index.js';
import type { RenderContext } from './context.js';
import type { Environment } from '../environment.js';
import { createResult } from './result.js';
import type { Pipeline } from '../pipeline.js';
import { ROUTE_TYPE_HEADER } from '../constants.js';

export type RenderPage = {
	mod: ComponentInstance;
	renderContext: RenderContext;
	env: Environment;
	pipeline: Pipeline;
	cookies: AstroCookies;
};

export async function renderPage({ mod, pipeline, renderContext, env }: RenderPage) {
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
		ssr: env.serverLike,
		status: renderContext.status ?? 200,
		cookies: pipeline.cookies,
		locals: pipeline.locals,
		locales: pipeline.environment.i18n?.locales,
		defaultLocale: pipeline.environment.i18n?.defaultLocale,
		routingStrategy: pipeline.environment.i18n?.routing,
		route: renderContext.route.route,
	});

	const response = await runtimeRenderPage(
		result,
		Component,
		renderContext.props,
		{},
		env.streaming,
		renderContext.route
	);
	response.headers.set(ROUTE_TYPE_HEADER, "page")
	return response;
}
