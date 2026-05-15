import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';
import { getVirtualModulePageName } from '../../vite-plugin-pages/util.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { createConsoleLogger } from '../app/entrypoints/index.js';
import { RedirectSinglePageBuiltModule } from '../redirects/component.js';
import { Pipeline } from '../base-pipeline.js';
import { createAssetLink, createStylesheetElementSet } from '../render/ssr-element.js';
import { createDefaultRoutes } from '../routing/default.js';
import { getFallbackRoute, routeIsFallback, routeIsRedirect } from '../routing/helpers.js';
import { findRouteToRewrite } from '../routing/rewrite.js';
import { cssOrder, mergeInlineCss, getPageData } from './runtime.js';
import { newNodePool } from '../../runtime/server/render/queue/pool.js';
import { HTMLStringCache } from '../../runtime/server/html-string-cache.js';
import { queueRenderingEnabled } from '../app/manifest.js';
class BuildPipeline extends Pipeline {
	internals;
	options;
	manifest;
	defaultRoutes;
	getName() {
		return 'BuildPipeline';
	}
	/**
	 * This cache is needed to map a single `RouteData` to its file path.
	 * @private
	 */
	#routesByFilePath = /* @__PURE__ */ new WeakMap();
	getSettings() {
		if (!this.options) {
			throw new Error('No options defined');
		}
		return this.options.settings;
	}
	getOptions() {
		if (!this.options) {
			throw new Error('No options defined');
		}
		return this.options;
	}
	getInternals() {
		if (!this.internals) {
			throw new Error('No internals defined');
		}
		return this.internals;
	}
	constructor(manifest, defaultRoutes = createDefaultRoutes(manifest)) {
		const resolveCache = /* @__PURE__ */ new Map();
		async function resolve(specifier) {
			if (resolveCache.has(specifier)) {
				return resolveCache.get(specifier);
			}
			const hashedFilePath = manifest.entryModules[specifier];
			if (typeof hashedFilePath !== 'string' || hashedFilePath === '') {
				if (specifier === BEFORE_HYDRATION_SCRIPT_ID) {
					resolveCache.set(specifier, '');
					return '';
				}
				throw new Error(`Cannot find the built path for ${specifier}`);
			}
			const assetLink = createAssetLink(hashedFilePath, manifest.base, manifest.assetsPrefix);
			resolveCache.set(specifier, assetLink);
			return assetLink;
		}
		const logger = createConsoleLogger({ level: manifest.logLevel });
		super(logger, manifest, 'production', manifest.renderers, resolve, manifest.serverLike);
		this.manifest = manifest;
		this.defaultRoutes = defaultRoutes;
		if (queueRenderingEnabled(this.manifest.experimentalQueuedRendering)) {
			this.nodePool = newNodePool(this.manifest.experimentalQueuedRendering);
			if (this.manifest.experimentalQueuedRendering.contentCache) {
				this.htmlStringCache = new HTMLStringCache(1e3);
			}
		}
	}
	getRoutes() {
		return this.getOptions().routesList.routes;
	}
	static create({ manifest }) {
		return new BuildPipeline(manifest);
	}
	setInternals(internals) {
		this.internals = internals;
	}
	setOptions(options) {
		this.options = options;
	}
	headElements(routeData) {
		const {
			manifest: { assetsPrefix, base },
		} = this;
		const settings = this.getSettings();
		const internals = this.getInternals();
		const links = /* @__PURE__ */ new Set();
		const pageBuildData = getPageData(internals, routeData.route, routeData.component);
		const scripts = /* @__PURE__ */ new Set();
		const sortedCssAssets = pageBuildData?.styles
			.sort(cssOrder)
			.map(({ sheet }) => sheet)
			.reduce(mergeInlineCss, []);
		const styles = createStylesheetElementSet(sortedCssAssets ?? [], base, assetsPrefix);
		if (settings.scripts.some((script) => script.stage === 'page')) {
			const hashedFilePath = internals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID);
			if (typeof hashedFilePath !== 'string') {
				throw new Error(`Cannot find the built path for ${PAGE_SCRIPT_ID}`);
			}
			const src = createAssetLink(hashedFilePath, base, assetsPrefix);
			scripts.add({
				props: { type: 'module', src },
				children: '',
			});
		}
		for (const script of settings.scripts) {
			if (script.stage === 'head-inline') {
				scripts.add({
					props: {},
					children: script.content,
				});
			}
		}
		return { scripts, styles, links };
	}
	componentMetadata() {}
	/**
	 * It collects the routes to generate during the build.
	 * It returns a map of page information and their relative entry point as a string.
	 */
	retrieveRoutesToGenerate() {
		const pages = /* @__PURE__ */ new Set();
		const defaultRouteComponents = new Set(this.defaultRoutes.map((route) => route.component));
		for (const { routeData } of this.manifest.routes) {
			if (routeIsRedirect(routeData)) {
				pages.add(routeData);
				continue;
			}
			if (routeIsFallback(routeData) && i18nHasFallback(this.manifest)) {
				pages.add(routeData);
				continue;
			}
			if (defaultRouteComponents.has(routeData.component)) {
				continue;
			}
			pages.add(routeData);
			const moduleSpecifier = getVirtualModulePageName(
				VIRTUAL_PAGE_RESOLVED_MODULE_ID,
				routeData.component,
			);
			const filePath = this.internals?.entrySpecifierToBundleMap.get(moduleSpecifier);
			if (filePath) {
				this.#routesByFilePath.set(routeData, filePath);
			}
		}
		return pages;
	}
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
		const { routeData, pathname, newUrl } = findRouteToRewrite({
			payload,
			request,
			routes: this.manifest.routes.map((routeInfo) => routeInfo.routeData),
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
			base: this.manifest.base,
			outDir: this.manifest.serverLike ? this.manifest.buildClientDir : this.manifest.outDir,
		});
		const componentInstance = await this.getComponentByRoute(routeData);
		return { routeData, componentInstance, newUrl, pathname };
	}
}
function i18nHasFallback(manifest) {
	if (manifest.i18n && manifest.i18n.fallback) {
		return Object.keys(manifest.i18n.fallback).length > 0;
	}
	return false;
}
export { BuildPipeline };
