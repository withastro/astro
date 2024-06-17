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
import { findRouteToRewrite } from '../routing/rewrite.js';

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
		_sourceRoute: RouteData
	): Promise<[RouteData, ComponentInstance, URL]> {
		const [foundRoute, finalUrl] = findRouteToRewrite({
			payload,
			request,
			routes: this.manifest?.routes.map((r) => r.routeData),
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
			base: this.manifest.base,
		});

		const componentInstance = await this.getComponentByRoute(foundRoute);
		return [foundRoute, componentInstance, finalUrl];
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
}
