import type {
	ComponentInstance,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRResult,
} from '../@types/astro.js';
import { type HeadElements, Pipeline } from '../core/base-pipeline.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';
import { InvalidRewrite404, RouteNotFound } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';
import {
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../core/render/ssr-element.js';
import { default404Page } from '../core/routing/astro-designed-error-pages.js';

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

	async tryRewrite(rewritePayload: RewritePayload): Promise<[RouteData, ComponentInstance]> {
		let foundRoute: RouteData | undefined;
		// options.manifest is the actual type that contains the information
		for (const route of this.manifest.routes) {
			const routeData = route.routeData;
			if (rewritePayload instanceof URL) {
				if (routeData.pattern.test(rewritePayload.pathname)) {
					foundRoute = routeData;
					break;
				}
			} else if (rewritePayload instanceof Request) {
				const url = new URL(rewritePayload.url);
				if (routeData.pattern.test(url.pathname)) {
					foundRoute = routeData;
					break;
				}
			} else if (routeData.pattern.test(decodeURI(rewritePayload))) {
				foundRoute = routeData;
				break;
			}
		}
		if (foundRoute) {
			const componentInstance = await this.getComponentByRoute(foundRoute);
			return [foundRoute, componentInstance];
		} else {
			throw new AstroError(RouteNotFound);
		}
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

	rewriteKnownRoute(pathname: string, _sourceRoute: RouteData): ComponentInstance {
		if (pathname === '/404') {
			return { default: default404Page } as any as ComponentInstance;
		}

		throw new AstroError(InvalidRewrite404);
	}
}
