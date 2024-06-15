import type {
	ComponentInstance,
	ManifestData,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRResult,
} from '../../@types/astro.js';
import { Pipeline } from '../base-pipeline.js';
import type { SinglePageBuiltModule } from '../build/types.js';
import { DEFAULT_404_COMPONENT } from '../constants.js';
import { RewriteEncounteredAnError } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { RedirectSinglePageBuiltModule } from '../redirects/component.js';
import { createModuleScriptElement, createStylesheetElementSet } from '../render/ssr-element.js';
import { DEFAULT_404_ROUTE } from '../routing/astro-designed-error-pages.js';

export class AppPipeline extends Pipeline {
	#manifestData: ManifestData | undefined;

	static create(
		manifestData: ManifestData,
		{
			logger,
			manifest,
			mode,
			renderers,
			resolve,
			serverLike,
			streaming,
		}: Pick<
			AppPipeline,
			'logger' | 'manifest' | 'mode' | 'renderers' | 'resolve' | 'serverLike' | 'streaming'
		>
	) {
		const pipeline = new AppPipeline(
			logger,
			manifest,
			mode,
			renderers,
			resolve,
			serverLike,
			streaming,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			false
		);
		pipeline.#manifestData = manifestData;
		return pipeline;
	}

	headElements(routeData: RouteData): Pick<SSRResult, 'scripts' | 'styles' | 'links'> {
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
		const links = new Set<never>();
		const scripts = new Set<SSRElement>();
		const styles = createStylesheetElementSet(routeInfo?.styles ?? []);

		for (const script of routeInfo?.scripts ?? []) {
			if ('stage' in script) {
				if (script.stage === 'head-inline') {
					scripts.add({
						props: {},
						children: script.children,
					});
				}
			} else {
				scripts.add(createModuleScriptElement(script));
			}
		}
		return { links, styles, scripts };
	}

	componentMetadata() {}
	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		const module = await this.getModuleForRoute(routeData);
		return module.page();
	}

	async tryRewrite(
		payload: RewritePayload,
		request: Request,
		sourceRoute: RouteData
	): Promise<[RouteData, ComponentInstance, URL]> {
		let foundRoute;

		let finalUrl: URL | undefined = undefined;
		for (const route of this.#manifestData!.routes) {
			if (payload instanceof URL) {
				finalUrl = payload;
			} else if (payload instanceof Request) {
				finalUrl = new URL(payload.url);
			} else {
				finalUrl = new URL(payload, new URL(request.url).origin);
			}

			if (route.pattern.test(decodeURI(finalUrl.pathname))) {
				foundRoute = route;
				break;
			} else if (finalUrl.pathname === '/404') {
				foundRoute = DEFAULT_404_ROUTE;
				break;
			}
		}

		if (foundRoute && finalUrl) {
			if (foundRoute.pathname === '/404') {
				const componentInstance = this.rewriteKnownRoute(foundRoute.pathname, sourceRoute);
				return [foundRoute, componentInstance, finalUrl];
			} else {
				const componentInstance = await this.getComponentByRoute(foundRoute);
				return [foundRoute, componentInstance, finalUrl];
			}
		}
		throw new AstroError({
			...RewriteEncounteredAnError,
			message: RewriteEncounteredAnError.message(payload.toString()),
		});
	}

	async getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule> {
		if (route.component === DEFAULT_404_COMPONENT) {
			return {
				page: async () =>
					({ default: () => new Response(null, { status: 404 }) }) as ComponentInstance,
				renderers: [],
			};
		}
		if (route.type === 'redirect') {
			return RedirectSinglePageBuiltModule;
		} else {
			if (this.manifest.pageMap) {
				const importComponentInstance = this.manifest.pageMap.get(route.component);
				if (!importComponentInstance) {
					throw new Error(
						`Unexpectedly unable to find a component instance for route ${route.route}`
					);
				}
				return await importComponentInstance();
			} else if (this.manifest.pageModule) {
				return this.manifest.pageModule;
			}
			throw new Error(
				"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
			);
		}
	}

	// We don't need to check the source route, we already are in SSR
	rewriteKnownRoute(pathname: string, _sourceRoute: RouteData): ComponentInstance {
		if (pathname === '/404') {
			return { default: () => new Response(null, { status: 404 }) } as ComponentInstance;
		} else {
			return { default: () => new Response(null, { status: 500 }) } as ComponentInstance;
		}
	}
}
