import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type {
	RouteData,
	SSRElement,
	SSRResult,
} from '../../types/public/internal.js';
import { VIRTUAL_PAGE_MODULE_ID, VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/index.js';
import { getVirtualModulePageName } from '../../vite-plugin-pages/util.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { SSRManifest } from '../app/types.js';
import type { TryRewriteResult } from '../base-pipeline.js';
import { routeIsFallback, routeIsRedirect } from '../redirects/helpers.js';
import { RedirectSinglePageBuiltModule } from '../redirects/index.js';
import { Pipeline } from '../render/index.js';
import { createAssetLink, createStylesheetElementSet } from '../render/ssr-element.js';
import { createDefaultRoutes } from '../routing/default.js';
import { findRouteToRewrite } from '../routing/rewrite.js';
import { getOutDirWithinCwd } from './common.js';
import { type BuildInternals, cssOrder, getPageData, mergeInlineCss } from './internal.js';
import type { SinglePageBuiltModule, StaticBuildOptions } from './types.js';

/**
 * The build pipeline is responsible to gather the files emitted by the SSR build and generate the pages by executing these files.
 */
export class BuildPipeline extends Pipeline {
	#componentsInterner: WeakMap<RouteData, SinglePageBuiltModule> = new WeakMap<
		RouteData,
		SinglePageBuiltModule
	>();
	/**
	 * This cache is needed to map a single `RouteData` to its file path.
	 * @private
	 */
	#routesByFilePath: WeakMap<RouteData, string> = new WeakMap<RouteData, string>();

	get outFolder() {
		return this.settings.buildOutput === 'server'
			? this.settings.config.build.server
			: getOutDirWithinCwd(this.settings.config.outDir);
	}

	private constructor(
		readonly internals: BuildInternals,
		readonly manifest: SSRManifest,
		readonly options: StaticBuildOptions,
		readonly config = options.settings.config,
		readonly settings = options.settings,
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

		const serverLike = settings.buildOutput === 'server';
		// We can skip streaming in SSG for performance as writing as strings are faster
		const streaming = serverLike;
		super(
			options.logger,
			manifest,
			options.runtimeMode,
			manifest.renderers,
			resolve,
			serverLike,
			streaming,
		);
	}

	getRoutes(): RouteData[] {
		return this.options.routesList.routes;
	}

	static create({
		internals,
		manifest,
		options,
	}: Pick<BuildPipeline, 'internals' | 'manifest' | 'options'>) {
		return new BuildPipeline(internals, manifest, options);
	}

	headElements(routeData: RouteData): Pick<SSRResult, 'scripts' | 'styles' | 'links'> {
		const {
			internals,
			manifest: { assetsPrefix, base },
			settings,
		} = this;
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
	retrieveRoutesToGenerate(): Map<RouteData, string> {
		const pages = new Map<RouteData, string>();

		for(const { routeData } of this.manifest.routes) {
			// Here, we take the component path and transform it in the virtual module name
			const moduleSpecifier = getVirtualModulePageName(VIRTUAL_PAGE_RESOLVED_MODULE_ID, routeData.component);
			// We retrieve the original JS module
			const filePath = this.internals.entrySpecifierToBundleMap.get(moduleSpecifier);
			if (filePath) {
				// it exists, added it to pages to render, using the file path that we just retrieved
				pages.set(routeData, filePath);

				// Populate the cache
				this.#routesByFilePath.set(routeData, filePath);
			}
		}

		return pages;
	}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		if (this.#componentsInterner.has(routeData)) {
			// SAFETY: checked before
			const entry = this.#componentsInterner.get(routeData)!;
			return await entry.page();
		}

		for (const route of this.defaultRoutes) {
			if (route.component === routeData.component) {
				return route.instance;
			}
		}

		// SAFETY: the pipeline calls `retrieveRoutesToGenerate`, which is in charge to fill the cache.
		const filePath = this.#routesByFilePath.get(routeData)!;
		const module = await this.retrieveSsrEntry(routeData, filePath);
		return module.page();
	}

	async tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult> {
		const { routeData, pathname, newUrl } = findRouteToRewrite({
			payload,
			request,
			routes: this.options.routesList.routes,
			trailingSlash: this.config.trailingSlash,
			buildFormat: this.config.build.format,
			base: this.config.base,
			outDir: this.serverLike ? this.manifest.buildClientDir : this.manifest.outDir,
		});

		const componentInstance = await this.getComponentByRoute(routeData);
		return { routeData, componentInstance, newUrl, pathname };
	}

	async retrieveSsrEntry(route: RouteData, filePath: string): Promise<SinglePageBuiltModule> {
		if (this.#componentsInterner.has(route)) {
			// SAFETY: it is checked inside the if
			return this.#componentsInterner.get(route)!;
		}
		let entry;
		if (routeIsRedirect(route)) {
			entry = await this.#getEntryForRedirectRoute(route, this.outFolder);
		} else if (routeIsFallback(route)) {
			entry = await this.#getEntryForFallbackRoute(route, this.outFolder);
		} else {
			const ssrEntryURLPage = createEntryURL(filePath, this.outFolder);
			entry = await import(ssrEntryURLPage.toString());
		}
		this.#componentsInterner.set(route, entry);
		return entry;
	}

	async #getEntryForFallbackRoute(
		route: RouteData,
		outFolder: URL,
	): Promise<SinglePageBuiltModule> {
		if (route.type !== 'fallback') {
			throw new Error(`Expected a redirect route.`);
		}
		if (route.redirectRoute) {
			const filePath = getEntryFilePath(this.internals, route.redirectRoute);
			if (filePath) {
				const url = createEntryURL(filePath, outFolder);
				const ssrEntryPage: SinglePageBuiltModule = await import(url.toString());
				return ssrEntryPage;
			}
		}

		return RedirectSinglePageBuiltModule;
	}

	async #getEntryForRedirectRoute(
		route: RouteData,
		outFolder: URL,
	): Promise<SinglePageBuiltModule> {
		if (route.type !== 'redirect') {
			throw new Error(`Expected a redirect route.`);
		}
		if (route.redirectRoute) {
			const filePath = getEntryFilePath(this.internals, route.redirectRoute);
			if (filePath) {
				const url = createEntryURL(filePath, outFolder);
				const ssrEntryPage: SinglePageBuiltModule = await import(url.toString());
				return ssrEntryPage;
			}
		}

		return RedirectSinglePageBuiltModule;
	}
}

function createEntryURL(filePath: string, outFolder: URL) {
	return new URL('./' + filePath + `?time=${Date.now()}`, outFolder);
}

/**
 * For a given pageData, returns the entry file path—aka a resolved virtual module in our internals' specifiers.
 */
function getEntryFilePath(internals: BuildInternals, pageData: RouteData) {
	const id = '\x00' + getVirtualModulePageName(VIRTUAL_PAGE_MODULE_ID, pageData.component);
	return internals.entrySpecifierToBundleMap.get(id);
}
