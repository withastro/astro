import type { ComponentInstance, ImportedDevStyle } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { DevToolbarMetadata } from '../../types/public/index.js';
import type {
	RouteData,
	SSRComponentMetadata,
	SSRElement,
	SSRManifest,
} from '../../types/public/internal.js';
import { stringifyForScript } from '../../runtime/server/escape.js';
import type { RequestLogPayload } from './index.js';
import type { SinglePageBuiltModule } from '../build/types.js';
import { ASTRO_VERSION } from '../constants.js';
import { getLogger } from '../logger/manifest-logger.js';
import { req } from '../messages/runtime.js';
import { RedirectSinglePageBuiltModule } from '../redirects/index.js';
import { createModuleScriptElement, createStylesheetElementSet } from '../render/ssr-element.js';
import { getDefaultRoutes } from '../routing/default.js';
import { findRouteToRewrite } from '../routing/rewrite.js';
import { getRouteTable } from '../routing/route-table.js';
import type { HeadElements, RenderEnvironment, TryRewriteResult } from './index.js';

// The dev environment that cannot load modules at runtime through the Vite
// environment APIs (e.g. requests executed inside workerd). The
// `virtual:astro:*` imports stay DYNAMIC inside the method bodies: this
// module is only registered inside Vite environments where those specifiers
// resolve, and plain-Node importers of the module itself never trigger them.

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

async function getComponentByRoute(
	manifest: SSRManifest,
	routeData: RouteData,
): Promise<ComponentInstance> {
	try {
		const module = await getModuleForRoute(manifest, routeData);
		return module.page();
	} catch {
		// could not find, ignore
	}

	const url = new URL(routeData.component, manifest.rootDir);
	const module = await import(/* @vite-ignore */ url.toString());
	return module;
}

/**
 * The non-runnable dev environment (workerd and other adapters whose requests
 * run outside Vite's module runner). Registered by the dev virtual entrypoint.
 */
export function createNonRunnableEnvironment(): RenderEnvironment {
	return {
		name: 'dev-nonrunnable',
		runtimeMode: 'development',
		// Dev always streams.
		defaultStreaming: () => true,

		async resolve(_manifest: SSRManifest, specifier: string): Promise<string> {
			if (specifier.startsWith('/')) {
				return specifier;
			} else {
				return '/@id/' + specifier;
			}
		},

		async headElements(manifest: SSRManifest, routeData: RouteData): Promise<HeadElements> {
			// This environment cannot call getComponentMetadata() (requires a ModuleLoader) so we
			// hydrate the manifest's componentMetadata from the virtual module exposed by vite-plugin-head.
			// This ensures head placement (containsHead / headInTree) is correct for adapters that run
			// requests outside of Vite's module runner, such as Cloudflare.
			const { componentMetadataEntries } = (await import('virtual:astro:component-metadata')) as {
				componentMetadataEntries: [string, SSRComponentMetadata][];
			};
			for (const [id, entry] of componentMetadataEntries) {
				manifest.componentMetadata.set(id, entry);
			}

			const { assetsPrefix, base } = manifest;
			const routeInfo = manifest.routes.find((route) => route.routeData === routeData);
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
					scripts.add(createModuleScriptElement(script));
				}
			}

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
					root: manifest.rootDir.toString(),
					version: ASTRO_VERSION,
					latestAstroVersion: manifest.devToolbar.latestAstroVersion,
					debugInfo: manifest.devToolbar.debugInfoOutput ?? '',
					placement: manifest.devToolbar.placement,
				};

				// Additional data for the dev overlay
				const children = `window.__astro_dev_toolbar__ = ${stringifyForScript(additionalMetadata)}`;
				scripts.add({ props: {}, children });
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
			for (const { id, url: src, content } of css) {
				// Vite handles HMR for styles injected as scripts
				scripts.add({ props: { type: 'module', src }, children: '' });
				// But we still want to inject the styles to avoid FOUC. The style tags
				// should emulate what Vite injects so further HMR works as expected.
				styles.add({ props: { 'data-vite-dev-id': id }, children: content });
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
			const { newUrl, pathname, routeData } = findRouteToRewrite({
				payload,
				request,
				// The single fresh route table: HMR route updates are visible
				// to rewrites at the same instant as every other consumer.
				routes: getRouteTable(manifest).routes,
				trailingSlash: manifest.trailingSlash,
				buildFormat: manifest.buildFormat,
				base: manifest.base,
				outDir: manifest.serverLike ? manifest.buildClientDir : manifest.outDir,
			});

			const componentInstance = await getComponentByRoute(manifest, routeData);
			return { newUrl, pathname, componentInstance, routeData };
		},

		getRenderers(manifest: SSRManifest) {
			return manifest.renderers;
		},

		errorStrategy: 'dev',
		injectCspMetaTagsOnErrorPages: false,

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
