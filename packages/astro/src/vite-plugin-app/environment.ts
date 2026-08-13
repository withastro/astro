import { fileURLToPath } from 'node:url';
import type {
	HeadElements,
	RenderEnvironment,
	TryRewriteResult,
} from '../core/environment/index.js';
import type { RequestLogPayload } from '../core/environment/index.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';
import { ASTRO_VERSION } from '../core/constants.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';
import { AggregateError, CSSError, MarkdownError } from '../core/errors/index.js';
import { getLogger } from '../core/logger/manifest-logger.js';
import { req } from '../core/messages/runtime.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import {
	RedirectComponentInstance,
	RedirectSinglePageBuiltModule,
} from '../core/redirects/index.js';
import { loadRenderer } from '../core/render/index.js';
import { getDefaultRoutes } from '../core/routing/default.js';
import { routeIsRedirect } from '../core/routing/helpers.js';
import { findRouteToRewrite } from '../core/routing/rewrite.js';
import { getRouteTable } from '../core/routing/route-table.js';
import { isPage } from '../core/util.js';
import { resolveIdToUrl } from '../core/viteUtils.js';
import { stringifyForScript } from '../runtime/server/escape.js';
import type { AstroSettings, ComponentInstance, ImportedDevStyle } from '../types/astro.js';
import type { RewritePayload } from '../types/public/common.js';
import type { DevToolbarMetadata } from '../types/public/index.js';
import type {
	RouteData,
	SSRElement,
	SSRLoadedRenderer,
	SSRManifest,
} from '../types/public/internal.js';
import { getComponentMetadata } from '../vite-plugin-astro-server/metadata.js';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';

/**
 * Per-manifest slot for the runnable dev server's renderers. Unlike every
 * other environment, runnable dev reloads renderers on each request (see
 * `getComponentByRoute` below), so the value is overwritten per request and
 * concurrent requests can observe each other's writes.
 */
const devRenderers = new WeakMap<SSRManifest, SSRLoadedRenderer[]>();

export function getDevRenderers(manifest: SSRManifest): SSRLoadedRenderer[] {
	return devRenderers.get(manifest) ?? [];
}

export function setDevRenderers(manifest: SSRManifest, renderers: SSRLoadedRenderer[]): void {
	devRenderers.set(manifest, renderers);
}

export interface RunnableEnvironmentOptions {
	loader: ModuleLoader;
	settings: AstroSettings;
	getDebugInfo: () => Promise<string>;
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

	if (route.type === 'redirect') {
		return RedirectSinglePageBuiltModule;
	} else {
		if (manifest.pageMap) {
			const importComponentInstance = manifest.pageMap.get(route.component);
			if (!importComponentInstance) {
				throw new Error(
					`Unexpectedly unable to find a component instance for route ${route.route}`,
				);
			}
			return await importComponentInstance();
		} else if (manifest.pageModule) {
			return manifest.pageModule;
		}
		throw new Error(
			"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue.",
		);
	}
}

/**
 * The runnable dev environment (the Vite SSR environment can load modules at
 * runtime). The ModuleLoader and AstroSettings are captured in this closure at
 * composition time (`createAstroServerApp`) and are unreachable from
 * requests/states by design — only the environment functions close over them.
 */
export function createRunnableEnvironment({
	loader,
	settings,
	getDebugInfo,
}: RunnableEnvironmentOptions): RenderEnvironment {
	// Renderers are (re)loaded on every request before the route module is
	// imported, into the per-manifest slot.
	async function getComponentByRoute(
		manifest: SSRManifest,
		routeData: RouteData,
	): Promise<ComponentInstance> {
		if (routeIsRedirect(routeData)) {
			return RedirectComponentInstance;
		}

		const filePath = new URL(`${routeData.component}`, manifest.rootDir);

		// First check built-in routes
		for (const route of getDefaultRoutes(manifest)) {
			if (route.matchesComponent(filePath)) {
				return route.instance;
			}
		}

		// Important: This needs to happen first, in case a renderer provides polyfills.
		if (settings) {
			const renderers__ = settings.renderers.map((r) => loadRenderer(r, loader));
			const renderers_ = await Promise.all(renderers__);
			setDevRenderers(
				manifest,
				renderers_.filter((r): r is SSRLoadedRenderer => Boolean(r)),
			);
		}

		try {
			// Load the module from the Vite SSR Runtime.
			return (await loader.import(filePath.toString())) as ComponentInstance;
		} catch (error) {
			// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
			if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
				throw error;
			}

			throw enhanceViteSSRError({ error, filePath, loader });
		}
	}

	return {
		name: 'dev-runnable',
		runtimeMode: 'development',
		// Dev always streams.
		defaultStreaming: () => true,

		resolve(manifest: SSRManifest, specifier: string): Promise<string> {
			return resolveIdToUrl(loader, specifier, manifest.rootDir);
		},

		async headElements(manifest: SSRManifest, routeData: RouteData): Promise<HeadElements> {
			const filePath = new URL(`${routeData.component}`, manifest.rootDir);
			const scripts = new Set<SSRElement>();

			// Inject HMR scripts
			if (settings) {
				if (isPage(filePath, settings)) {
					scripts.add({
						props: { type: 'module', src: '/@vite/client' },
						children: '',
					});

					if (manifest.devToolbar.enabled) {
						scripts.add({
							props: {
								type: 'module',
								src: '/@id/astro/runtime/client/dev-toolbar/entrypoint.js',
							},
							children: '',
						});

						const additionalMetadata: DevToolbarMetadata['__astro_dev_toolbar__'] = {
							root: fileURLToPath(settings.config.root),
							version: ASTRO_VERSION,
							latestAstroVersion: settings.latestAstroVersion,
							// TODO: Currently the debug info is always fetched, which slows things down.
							// We should look into not loading it if the dev toolbar is disabled. And when
							// enabled, it would nice to request the debug info through import.meta.hot
							// when the button is click to defer execution as much as possible
							debugInfo: await getDebugInfo(),
							placement: settings.config.devToolbar.placement,
						};

						// Additional data for the dev overlay
						const children = `window.__astro_dev_toolbar__ = ${stringifyForScript(additionalMetadata)}`;
						scripts.add({ props: {}, children });
					}
				}

				// TODO: We should allow adding generic HTML elements to the head, not just scripts
				for (const script of settings.scripts) {
					if (script.stage === 'head-inline') {
						scripts.add({
							props: {},
							children: script.content,
						});
					} else if (script.stage === 'page' && isPage(filePath, settings)) {
						scripts.add({
							props: { type: 'module', src: `/@id/${PAGE_SCRIPT_ID}` },
							children: '',
						});
					}
				}
			}

			const { devCSSMap } = await import('virtual:astro:dev-css-all');

			const importer = devCSSMap.get(routeData.component);
			let css = new Set<ImportedDevStyle>();
			if (importer) {
				const cssModule = await importer();
				css = cssModule.css;
			} else {
				getLogger(manifest).warn(
					'assets',
					`Unable to find CSS for ${routeData.component}. This is likely a bug in Astro.`,
				);
			}

			// Pass framework CSS in as style tags to be appended to the page.
			const links = new Set<SSRElement>();

			const styles = new Set<SSRElement>();
			for (const { id, url: src, content } of css) {
				// Vite handles HMR for styles injected as scripts
				scripts.add({ props: { type: 'module', src }, children: '' });
				// But we still want to inject the styles to avoid FOUC. The style tags
				// should emulate what Vite injects so further HMR works as expected.
				styles.add({ props: { 'data-vite-dev-id': id }, children: content });
			}

			return { scripts, styles, links };
		},

		componentMetadata(manifest: SSRManifest, routeData: RouteData) {
			const filePath = new URL(`${routeData.component}`, manifest.rootDir);
			return getComponentMetadata(filePath, loader);
		},

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
				// The single fresh route table: HMR route updates are visible
				// to rewrites at the same instant as every other consumer.
				routes: getRouteTable(manifest).routes,
				trailingSlash: manifest.trailingSlash,
				buildFormat: manifest.buildFormat,
				base: manifest.base,
				outDir: manifest.outDir,
			});

			const componentInstance = await getComponentByRoute(manifest, routeData);
			return { newUrl, pathname, componentInstance, routeData };
		},

		getRenderers(manifest: SSRManifest) {
			return getDevRenderers(manifest);
		},

		errorStrategy: 'dev',
		injectCspMetaTagsOnErrorPages: true,

		logRequest(manifest: SSRManifest, payload: RequestLogPayload): void {
			const { pathname, method, statusCode, isRewrite, timeStart } = payload;
			if (pathname === '/favicon.ico') {
				return;
			}
			const reqTime = performance.now() - timeStart;
			getLogger(manifest).info(
				null,
				req({
					url: pathname,
					method,
					statusCode,
					isRewrite,
					reqTime,
				}),
			);
		},
	};
}
