import type {
	ComponentInstance,
	MiddlewareHandler,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRResult,
} from '../@types/astro.js';
import { type HeadElements, Pipeline, type TryRewriteResult } from '../core/base-pipeline.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';
import {
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../core/render/ssr-element.js';
import { findRouteToRewrite } from '../core/routing/rewrite.js';
import { NOOP_MIDDLEWARE_FN } from '../core/middleware/noop-middleware.js';
import { sequence } from '../core/middleware/index.js';
import { createOriginCheckMiddleware } from '../core/app/middlewares.js';

export class ContainerPipeline extends Pipeline {
	/**
	 * Internal cache to store components instances by `RouteData`.
	 * @private
	 */
	#componentsInterner: WeakMap<RouteData, SinglePageBuiltModule> = new WeakMap<
		RouteData,
		SinglePageBuiltModule
	>();

	resolvedMiddleware: MiddlewareHandler | undefined = undefined;

	async getMiddleware(): Promise<MiddlewareHandler> {
		if (this.resolvedMiddleware) {
			return this.resolvedMiddleware;
		} else {
			const middlewareInstance = await this.middleware();
			const onRequest = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
			if (this.manifest.checkOrigin) {
				this.resolvedMiddleware = sequence(createOriginCheckMiddleware(), onRequest);
			} else {
				this.resolvedMiddleware = onRequest;
			}
			return this.resolvedMiddleware;
		}
	}

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
			streaming,
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

	async tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult> {
		const { newUrl, pathname, routeData } = findRouteToRewrite({
			payload,
			request,
			routes: this.manifest?.routes.map((r) => r.routeData),
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
			base: this.manifest.base,
		});

		const componentInstance = await this.getComponentByRoute(routeData);
		return { componentInstance, routeData, newUrl, pathname };
	}

	insertRoute(route: RouteData, componentInstance: ComponentInstance): void {
		this.#componentsInterner.set(route, {
			page() {
				return Promise.resolve(componentInstance);
			},
			renderers: this.manifest.renderers,
			onRequest: this.resolvedMiddleware,
		});
	}

	// At the moment it's not used by the container via any public API
	// @ts-expect-error It needs to be implemented.
	async getComponentByRoute(_routeData: RouteData): Promise<ComponentInstance> {}
}
