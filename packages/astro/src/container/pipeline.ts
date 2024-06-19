import type {
	ComponentInstance,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRResult,
} from '../@types/astro.js';
import { type HeadElements, Pipeline } from '../core/base-pipeline.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';
import { RouteNotFound } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';
import {
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../core/render/ssr-element.js';
import { DEFAULT_404_ROUTE } from '../core/routing/astro-designed-error-pages.js';
import {findRouteToRewrite} from "../core/routing/rewrite.js";

export class ContainerPipeline extends Pipeline {
	/**
	 * Internal cache to store components instances by `RouteData`.
	 * @private
	 */
	#componentsInterner: WeakMap<RouteData, SinglePageBuiltModule> = new WeakMap<
		RouteData,
		SinglePageBuiltModule
	>();

	static create({
		logger,
		manifest,
		renderers,
		resolve,
		serverLike,
		streaming,
	}: Pick<
		ContainerPipeline,
		'logger' | 'manifest' | 'renderers' | 'resolve' | 'serverLike' | 'streaming'
	>) {
		return new ContainerPipeline(
			logger,
			manifest,
			'development',
			renderers,
			resolve,
			serverLike,
			streaming
		);
	}

	componentMetadata(_routeData: RouteData): Promise<SSRResult['componentMetadata']> | void {}

	headElements(routeData: RouteData): Promise<HeadElements> | HeadElements {
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
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

	async tryRewrite(
		payload: RewritePayload,
		request: Request
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

	insertRoute(route: RouteData, componentInstance: ComponentInstance): void {
		this.#componentsInterner.set(route, {
			page() {
				return Promise.resolve(componentInstance);
			},
			renderers: this.manifest.renderers,
			onRequest: this.manifest.middleware,
		});
	}

	// At the moment it's not used by the container via any public API
	// @ts-expect-error It needs to be implemented.
	async getComponentByRoute(_routeData: RouteData): Promise<ComponentInstance> {}
}
