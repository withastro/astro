import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData, SSRElement, SSRResult } from '../../types/public/internal.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';
import { getVirtualModulePageName } from '../../vite-plugin-pages/util.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { createConsoleLogger } from '../app/entrypoints/index.js';
import type { SSRManifest } from '../app/types.js';
import type { TryRewriteResult } from '../base-pipeline.js';
import { RedirectSinglePageBuiltModule } from '../redirects/component.js';
import { Pipeline } from '../base-pipeline.js';
import { createAssetLink, createStylesheetElementSet } from '../render/ssr-element.js';
import { createDefaultRoutes } from '../routing/default.js';
import { getFallbackRoute, routeIsFallback, routeIsRedirect } from '../routing/helpers.js';
import { findRouteToRewrite } from '../routing/rewrite.js';
import type { BuildInternals } from './internal.js';
import { cssOrder, mergeInlineCss, getPageData } from './runtime.js';
import type { SinglePageBuiltModule, StaticBuildOptions } from './types.js';
import { newNodePool } from '../../runtime/server/render/queue/pool.js';
import { HTMLStringCache } from '../../runtime/server/html-string-cache.js';
import { queueRenderingEnabled } from '../app/manifest.js';

/**
 * The build pipeline is responsible to gather the files emitted by the SSR build and generate the pages by executing these files.
 */
export class BuildPipeline extends Pipeline {
	internals: BuildInternals | undefined;
	options: StaticBuildOptions | undefined;

	getName(): string {
		return 'BuildPipeline';
	}

	/**
	 * This cache is needed to map a single `RouteData` to its file path.
	 * @private
	 */
	#routesByFilePath: WeakMap<RouteData, string> = new WeakMap<RouteData, string>();

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

	private constructor(
		readonly manifest: SSRManifest,
		readonly defaultRoutes = createDefaultRoutes(manifest),
	) {
		const resolveCache = new Map<string, string>();

		async function resolve(specifier: string) {
			if (resolveCache.has(specifier)) {
				return resolveCache.get(specifier)!;
			}
			const hashedFilePath = manifest.entryModules[specifier];
			if (typeof hashedFilePath !== 'string' || hashedFilePath === '') {
				// If no "astro:scripts/before-hydration.js" script exists in the build,
				// then we can assume that no before-hydration scripts are needed.
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
		const logger = createConsoleLogger(manifest.logLevel);
		// We can skip streaming in SSG for performance as writing as strings are faster
		super(logger, manifest, 'production', manifest.renderers, resolve, manifest.serverLike);
		if (queueRenderingEnabled(this.manifest.experimentalQueuedRendering)) {
			this.nodePool = newNodePool(this.manifest.experimentalQueuedRendering!);
			this.htmlStringCache = new HTMLStringCache(1000); // Use default size
		}
	}

	getRoutes(): RouteData[] {
		return this.getOptions().routesList.routes;
	}

	static create({ manifest }: Pick<BuildPipeline, 'manifest'>) {
		return new BuildPipeline(manifest);
	}

	public setInternals(internals: BuildInternals) {
		this.internals = internals;
	}

	public setOptions(options: StaticBuildOptions) {
		this.options = options;
	}

	headElements(routeData: RouteData): Pick<SSRResult, 'scripts' | 'styles' | 'links'> {
		const {
			manifest: { assetsPrefix, base },
		} = this;

		const settings = this.getSettings();
		const internals = this.getInternals();
		const links = new Set<never>();
		const pageBuildData = getPageData(internals, routeData.route, routeData.component);
		const scripts = new Set<SSRElement>();
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

		// Add all injected scripts to the page.
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
	retrieveRoutesToGenerate(): Set<RouteData> {
		const pages = new Set<RouteData>();

		// Keep a list of the default routes names for faster lookup
		const defaultRouteComponents = new Set(this.defaultRoutes.map((route) => route.component));

		for (const { routeData } of this.manifest.routes) {
			if (routeIsRedirect(routeData)) {
				// the component path isn't really important for redirects
				pages.add(routeData);
				continue;
			}

			if (routeIsFallback(routeData) && i18nHasFallback(this.manifest)) {
				pages.add(routeData);
				continue;
			}

			// Default routes like the server islands route, should not be generated
			if (defaultRouteComponents.has(routeData.component)) {
				continue;
			}

			// A regular page, add it to the set
			pages.add(routeData);

			// TODO The following is almost definitely legacy. We can remove it when we confirm
			// getComponentByRoute is not actually used.

			// Here, we take the component path and transform it in the virtual module name
			const moduleSpecifier = getVirtualModulePageName(
				VIRTUAL_PAGE_RESOLVED_MODULE_ID,
				routeData.component,
			);

			// We retrieve the original JS module
			const filePath = this.internals?.entrySpecifierToBundleMap.get(moduleSpecifier);

			if (filePath) {
				// Populate the cache
				this.#routesByFilePath.set(routeData, filePath);
			}
		}

		return pages;
	}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		const module = await this.getModuleForRoute(routeData);
		return module.page();
	}

	async getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule> {
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

function i18nHasFallback(manifest: SSRManifest): boolean {
	if (manifest.i18n && manifest.i18n.fallback) {
		// we have some fallback and the control is not none
		return Object.keys(manifest.i18n.fallback).length > 0;
	}

	return false;
}
