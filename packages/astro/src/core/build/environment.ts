import type { AstroSettings, ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData, SSRElement, SSRManifest } from '../../types/public/internal.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { HeadElements, RenderEnvironment, TryRewriteResult } from '../environment/index.js';
import { RedirectSinglePageBuiltModule } from '../redirects/index.js';
import { createAssetLink, createStylesheetElementSet } from '../render/ssr-element.js';
import { getDefaultRoutes } from '../routing/default.js';
import { getFallbackRoute, routeIsFallback, routeIsRedirect } from '../routing/helpers.js';
import { findRouteToRewrite } from '../routing/rewrite.js';
import type { BuildInternals } from './internal.js';
import { cssOrder, getPageData, mergeInlineCss } from './runtime.js';
import type { SinglePageBuiltModule, StaticBuildOptions } from './types.js';

/**
 * The build / prerender environment record and its mutable closure slots.
 * The build has a two-phase initialization: the prerender bundle is imported
 * first, and `createDefaultPrerenderer.setup()` injects `BuildInternals` /
 * `StaticBuildOptions` afterwards through the facade. The slots live in this
 * closure; accessors throw before injection, and the environment functions
 * close over the same slots.
 */
export interface BuildEnvironmentSlots {
	/** The build `RenderEnvironment`; its functions close over the slots below. */
	env: RenderEnvironment;
	setInternals(internals: BuildInternals): void;
	setOptions(options: StaticBuildOptions): void;
	/** Throws `No internals defined` before injection. */
	getInternals(): BuildInternals;
	/** Throws `No options defined` before injection. */
	getOptions(): StaticBuildOptions;
	/** Throws `No options defined` before injection. */
	getSettings(): AstroSettings;
}

// Identical to the production implementation: redirect + i18n-fallback
// handling over pageMap/pageModule.
async function getModuleForRoute(
	manifest: SSRManifest,
	route: RouteData,
): Promise<SinglePageBuiltModule> {
	for (const defaultRoute of getDefaultRoutes(manifest)) {
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
		// This is an i18n fallback route
		routeToProcess = getFallbackRoute(route, manifest.routes);
	}

	if (manifest.pageMap) {
		const importComponentInstance = manifest.pageMap.get(routeToProcess.component);
		if (!importComponentInstance) {
			throw new Error(`Unexpectedly unable to find a component instance for route ${route.route}`);
		}
		return await importComponentInstance();
	} else if (manifest.pageModule) {
		return manifest.pageModule;
	}
	throw new Error(
		"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue.",
	);
}

async function getComponentByRoute(
	manifest: SSRManifest,
	routeData: RouteData,
): Promise<ComponentInstance> {
	const module = await getModuleForRoute(manifest, routeData);
	return module.page();
}

export function createBuildEnvironment(): BuildEnvironmentSlots {
	let internals: BuildInternals | undefined;
	let options: StaticBuildOptions | undefined;

	function getInternals(): BuildInternals {
		if (!internals) {
			throw new Error('No internals defined');
		}
		return internals;
	}

	function getOptions(): StaticBuildOptions {
		if (!options) {
			throw new Error('No options defined');
		}
		return options;
	}

	function getSettings(): AstroSettings {
		return getOptions().settings;
	}

	// The resolve cache lives for the whole build.
	const resolveCache = new Map<string, string>();

	const env: RenderEnvironment = {
		name: 'build',
		runtimeMode: 'production',
		// We can skip streaming in SSG for performance as writing as strings is
		// faster.
		defaultStreaming: (manifest) => manifest.serverLike,

		async resolve(manifest: SSRManifest, specifier: string): Promise<string> {
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
		},

		headElements(manifest: SSRManifest, routeData: RouteData): HeadElements {
			const { assetsPrefix, base } = manifest;

			const settings = getSettings();
			const buildInternals = getInternals();
			const links = new Set<never>();
			const pageBuildData = getPageData(buildInternals, routeData.route, routeData.component);
			const scripts = new Set<SSRElement>();
			const sortedCssAssets = pageBuildData?.styles
				.sort(cssOrder)
				.map(({ sheet }) => sheet)
				.reduce(mergeInlineCss, []);
			const styles = createStylesheetElementSet(sortedCssAssets ?? [], base, assetsPrefix);

			if (settings.scripts.some((script) => script.stage === 'page')) {
				const hashedFilePath = buildInternals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID);
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
		},

		componentMetadata() {},

		getComponentByRoute,
		getModuleForRoute,

		async tryRewrite(
			manifest: SSRManifest,
			payload: RewritePayload,
			request: Request,
		): Promise<TryRewriteResult> {
			const { routeData, pathname, newUrl } = findRouteToRewrite({
				payload,
				request,
				// RAW manifest routes, exactly like `BuildPipeline.tryRewrite` — see
				// the production environment's tryRewrite for why the derived
				// (ensured-404) table is NOT observably identical here.
				routes: manifest.routes.map((r) => r.routeData),
				trailingSlash: manifest.trailingSlash,
				buildFormat: manifest.buildFormat,
				base: manifest.base,
				outDir: manifest.serverLike ? manifest.buildClientDir : manifest.outDir,
			});

			const componentInstance = await getComponentByRoute(manifest, routeData);
			return { routeData, componentInstance, newUrl, pathname };
		},

		getRenderers(manifest: SSRManifest) {
			return manifest.renderers;
		},

		errorStrategy: 'build',
		injectCspMetaTagsOnErrorPages: false,
		logRequest() {},
	};

	return {
		env,
		setInternals(value) {
			internals = value;
		},
		setOptions(value) {
			options = value;
		},
		getInternals,
		getOptions,
		getSettings,
	};
}
