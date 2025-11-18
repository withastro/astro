import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData, SSRElement } from '../../types/public/internal.js';
import { type HeadElements, Pipeline, type TryRewriteResult } from '../base-pipeline.js';
import type { SinglePageBuiltModule } from '../build/types.js';
import { RedirectSinglePageBuiltModule } from '../redirects/index.js';
import {
	createAssetLink,
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../render/ssr-element.js';
import { getFallbackRoute, routeIsFallback, routeIsRedirect } from '../routing/index.js';
import { findRouteToRewrite } from '../routing/rewrite.js';

export class AppPipeline extends Pipeline {
	getName(): string {
		return 'AppPipeline';
	}

	static create({
		logger,
		manifest,
		streaming,
	}: Pick<AppPipeline, 'logger' | 'manifest' | 'streaming'>) {
		const resolve = async function resolve(specifier: string) {
			if (!(specifier in manifest.entryModules)) {
				throw new Error(`Unable to resolve [${specifier}]`);
			}
			const bundlePath = manifest.entryModules[specifier];
			if (bundlePath.startsWith('data:') || bundlePath.length === 0) {
				return bundlePath;
			} else {
				return createAssetLink(bundlePath, manifest.base, manifest.assetsPrefix);
			}
		};
		const pipeline = new AppPipeline(
			logger,
			manifest,
			'production',
			manifest.renderers,
			resolve,
			streaming,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
		);
		return pipeline;
	}

	async headElements(routeData: RouteData): Promise<HeadElements> {
		const { assetsPrefix, base } = this.manifest;
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
		const links = new Set<never>();
		const scripts = new Set<SSRElement>();
		const styles = createStylesheetElementSet(routeInfo?.styles ?? [], base, assetsPrefix);

		for (const script of routeInfo?.scripts ?? []) {
			if ('stage' in script) {
				if (script.stage === 'head-inline') {
					scripts.add({
						props: {},
						children: script.children,
					});
				}
			} else {
				scripts.add(createModuleScriptElement(script, base, assetsPrefix));
			}
		}
		return { links, styles, scripts };
	}

	componentMetadata() {}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		const module = await this.getModuleForRoute(routeData);
		return module.page();
	}

	async getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule> {
		for (const defaultRoute of this.defaultRoutes) {
			if (route.component === defaultRoute.component) {
				return {
					page: () => Promise.resolve(defaultRoute.instance),
					renderers: [],
				};
			}
		}
		let routeToProcess = route;
		if (routeIsRedirect(route)) {
			if (route.redirectRoute) {
				// This is a static redirect
				routeToProcess = route.redirectRoute;
			} else {
				// This is an external redirect, so we return a component stub
				return RedirectSinglePageBuiltModule;
			}
		} else if (routeIsFallback(route)) {
			// This is a i18n fallback route
			routeToProcess = getFallbackRoute(route, this.manifest.routes);
		}

		if (this.manifest.pageMap) {
			const importComponentInstance = this.manifest.pageMap.get(routeToProcess.component);
			if (!importComponentInstance) {
				throw new Error(
					`Unexpectedly unable to find a component instance for route ${route.route}`,
				);
			}
			return await importComponentInstance();
		} else if (this.manifest.pageModule) {
			return this.manifest.pageModule;
		}
		throw new Error(
			"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue.",
		);
	}

	async tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult> {
		const { newUrl, pathname, routeData } = findRouteToRewrite({
			payload,
			request,
			routes: this.manifest?.routes.map((r) => r.routeData),
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
			base: this.manifest.base,
			outDir: this.manifest?.serverLike ? this.manifest.buildClientDir : this.manifest.outDir,
		});

		const componentInstance = await this.getComponentByRoute(routeData);
		return { newUrl, pathname, componentInstance, routeData };
	}
}
