import type { ComponentInstance } from '../types/astro.js';
import type { RewritePayload } from '../types/public/common.js';
import type {
	RouteData,
	SSRElement,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../types/public/internal.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';
import type {
	HeadElements,
	RenderEnvironment,
	TryRewriteResult,
} from '../core/environment/index.js';
import { RedirectSinglePageBuiltModule } from '../core/redirects/index.js';
import {
	createModuleScriptElement,
	createStylesheetElementSet,
} from '../core/render/ssr-element.js';
import { getDefaultRoutes } from '../core/routing/default.js';
import { findRouteToRewrite } from '../core/routing/rewrite.js';

export interface ContainerEnvironmentOptions {
	/**
	 * The route → module interner. Created by `experimental_AstroContainer`'s
	 * constructor and shared with its `insertRoute` writes; this record owns
	 * the lookups.
	 */
	interner: WeakMap<RouteData, SinglePageBuiltModule>;
	resolve: SSRResult['resolve'];
	renderers: SSRLoadedRenderer[];
	streaming: boolean;
}

// Base-`Pipeline.getModuleForRoute` port: the container pipeline never
// overrode it, so the environment record reproduces the inherited behavior.
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
 * The container environment. Registered by `experimental_AstroContainer`'s
 * constructor on its fabricated manifest — the container never touches the
 * ambient manifest, so multiple containers in one process stay isolated.
 */
export function createContainerEnvironment({
	interner,
	resolve,
	renderers,
	streaming,
}: ContainerEnvironmentOptions): RenderEnvironment {
	async function getComponentByRoute(
		_manifest: SSRManifest,
		routeData: RouteData,
	): Promise<ComponentInstance> {
		const page = interner.get(routeData);
		if (page) {
			return page.page();
		}
		throw new Error("Couldn't find component for route " + routeData.pathname);
	}

	return {
		name: 'container',
		runtimeMode: 'development',
		defaultStreaming: () => streaming,

		async resolve(_manifest: SSRManifest, specifier: string): Promise<string> {
			return resolve(specifier);
		},

		headElements(manifest: SSRManifest, routeData: RouteData): HeadElements {
			const routeInfo = manifest.routes.find((route) => route.routeData === routeData);
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
				// PER-CALL scan of the live manifest routes: the container inserts
				// routes at runtime (`insertRoute` pushes into `manifest.routes`),
				// and an uncompiled scan sees them immediately. Reading the derived
				// route table here would miss them.
				routes: manifest.routes.map((r) => r.routeData),
				trailingSlash: manifest.trailingSlash,
				buildFormat: manifest.buildFormat,
				base: manifest.base,
				outDir: manifest.outDir,
			});

			const componentInstance = await getComponentByRoute(manifest, routeData);
			return { componentInstance, routeData, newUrl, pathname };
		},

		getRenderers() {
			return renderers;
		},

		errorStrategy: 'default',
		injectCspMetaTagsOnErrorPages: false,
		logRequest() {},
	};
}
