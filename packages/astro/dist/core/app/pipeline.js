import { Pipeline } from '../base-pipeline.js';
import { RedirectSinglePageBuiltModule } from '../redirects/index.js';
import {
	createAssetLink,
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../render/ssr-element.js';
import { getFallbackRoute, routeIsFallback, routeIsRedirect } from '../routing/helpers.js';
import { findRouteToRewrite } from '../routing/rewrite.js';
import { createConsoleLogger } from '../logger/impls/console.js';
class AppPipeline extends Pipeline {
	getName() {
		return 'AppPipeline';
	}
	static create({ manifest, streaming }) {
		const resolve = async function resolve2(specifier) {
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
		const logger = createConsoleLogger({ level: manifest.logLevel });
		const pipeline = new AppPipeline(
			logger,
			manifest,
			'production',
			manifest.renderers,
			resolve,
			streaming,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
		);
		return pipeline;
	}
	async headElements(routeData) {
		const { assetsPrefix, base } = this.manifest;
		const routeInfo = this.manifest.routes.find(
			(route) => route.routeData.route === routeData.route,
		);
		const links = /* @__PURE__ */ new Set();
		const scripts = /* @__PURE__ */ new Set();
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
	async getComponentByRoute(routeData) {
		const module = await this.getModuleForRoute(routeData);
		return module.page();
	}
	async getModuleForRoute(route) {
		for (const defaultRoute of this.defaultRoutes) {
			if (route.component === defaultRoute.component) {
				return {
					page: () => Promise.resolve(defaultRoute.instance),
				};
			}
		}
		let routeToProcess = route;
		if (routeIsRedirect(route)) {
			if (route.redirectRoute) {
				routeToProcess = route.redirectRoute;
			} else {
				return RedirectSinglePageBuiltModule;
			}
		} else if (routeIsFallback(route)) {
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
	async tryRewrite(payload, request) {
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
export { AppPipeline };
