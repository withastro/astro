import { fileURLToPath } from 'node:url';
import { type HeadElements, Pipeline, type TryRewriteResult } from '../core/base-pipeline.js';
import { ASTRO_VERSION } from '../core/constants.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';
import { AggregateError, CSSError, MarkdownError } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { RedirectComponentInstance } from '../core/redirects/index.js';
import { loadRenderer } from '../core/render/index.js';
import { createDefaultRoutes } from '../core/routing/default.js';
import { routeIsRedirect } from '../core/routing/index.js';
import { findRouteToRewrite } from '../core/routing/rewrite.js';
import { isPage } from '../core/util.js';
import { resolveIdToUrl } from '../core/viteUtils.js';
import type { AstroSettings, ComponentInstance, RoutesList } from '../types/astro.js';
import type {
	DevToolbarMetadata,
	RewritePayload,
	RouteData,
	SSRElement,
	SSRLoadedRenderer,
	SSRManifest,
} from '../types/public/index.js';
import { getComponentMetadata } from '../vite-plugin-astro-server/metadata.js';
import { createResolve } from '../vite-plugin-astro-server/resolve.js';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';
import { getDevCSSModuleName } from '../vite-plugin-css/util.js';

/**
 * This Pipeline is used when the Vite SSR environment is runnable.
 */
export class RunnablePipeline extends Pipeline {
	getName(): string {
		return 'RunnablePipeline';
	}

	// renderers are loaded on every request,
	// so it needs to be mutable here unlike in other environments
	override renderers = new Array<SSRLoadedRenderer>();

	routesList: RoutesList | undefined;

	componentInterner: WeakMap<RouteData, ComponentInstance> = new WeakMap<
		RouteData,
		ComponentInstance
	>();

	private constructor(
		readonly loader: ModuleLoader,
		readonly logger: Logger,
		readonly manifest: SSRManifest,
		readonly settings: AstroSettings,
		readonly getDebugInfo: () => Promise<string>,
		readonly defaultRoutes = createDefaultRoutes(manifest),
	) {
		const resolve = createResolve(loader, manifest.rootDir);
		const streaming = true;
		super(logger, manifest, 'development', [], resolve, streaming);
	}

	static create(
		manifestData: RoutesList,
		{
			loader,
			logger,
			manifest,
			settings,
			getDebugInfo,
		}: Pick<RunnablePipeline, 'loader' | 'logger' | 'manifest' | 'settings' | 'getDebugInfo'>,
	) {
		const pipeline = new RunnablePipeline(loader, logger, manifest, settings, getDebugInfo);
		pipeline.routesList = manifestData;
		return pipeline;
	}

	async headElements(routeData: RouteData): Promise<HeadElements> {
		const { manifest, loader, runtimeMode, settings } = this;
		const filePath = new URL(`${routeData.component}`, manifest.rootDir);
		const scripts = new Set<SSRElement>();

		// Inject HMR scripts
		if (settings) {
			if (isPage(filePath, settings) && runtimeMode === 'development') {
				scripts.add({
					props: { type: 'module', src: '/@vite/client' },
					children: '',
				});

				if (
					settings.config.devToolbar.enabled &&
					(await settings.preferences.get('devToolbar.enabled'))
				) {
					const src = await resolveIdToUrl(
						loader,
						'astro/runtime/client/dev-toolbar/entrypoint.js',
					);
					scripts.add({ props: { type: 'module', src }, children: '' });

					const additionalMetadata: DevToolbarMetadata['__astro_dev_toolbar__'] = {
						root: fileURLToPath(settings.config.root),
						version: ASTRO_VERSION,
						latestAstroVersion: settings.latestAstroVersion,
						// TODO: Currently the debug info is always fetched, which slows things down.
						// We should look into not loading it if the dev toolbar is disabled. And when
						// enabled, it would nice to request the debug info through import.meta.hot
						// when the button is click to defer execution as much as possible
						debugInfo: await this.getDebugInfo(),
					};

					// Additional data for the dev overlay
					const children = `window.__astro_dev_toolbar__ = ${JSON.stringify(additionalMetadata)}`;
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

		const { css } = await loader.import(getDevCSSModuleName(routeData.component));

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
	}

	componentMetadata(routeData: RouteData) {
		const filePath = new URL(`${routeData.component}`, this.manifest.rootDir);
		return getComponentMetadata(filePath, this.loader);
	}

	async preload(routeData: RouteData, filePath: URL) {
		if (routeIsRedirect(routeData)) {
			return RedirectComponentInstance;
		}

		const { loader } = this;

		// First check built-in routes
		for (const route of this.defaultRoutes) {
			if (route.matchesComponent(filePath)) {
				return route.instance;
			}
		}

		// Important: This needs to happen first, in case a renderer provides polyfills.
		if (this.settings) {
			const renderers__ = this.settings.renderers.map((r) => loadRenderer(r, loader));
			const renderers_ = await Promise.all(renderers__);
			this.renderers = renderers_.filter((r): r is SSRLoadedRenderer => Boolean(r));
		}

		try {
			// Load the module from the Vite SSR Runtime.
			const componentInstance = (await loader.import(filePath.toString())) as ComponentInstance;
			this.componentInterner.set(routeData, componentInstance);
			return componentInstance;
		} catch (error) {
			// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
			if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
				throw error;
			}

			throw enhanceViteSSRError({ error, filePath, loader });
		}
	}

	clearRouteCache() {
		this.routeCache.clearAll();
		this.componentInterner = new WeakMap<RouteData, ComponentInstance>();
	}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		const component = this.componentInterner.get(routeData);
		if (component) {
			return component;
		} else {
			const filePath = new URL(`${routeData.component}`, this.manifest.rootDir);
			return await this.preload(routeData, filePath);
		}
	}

	async tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult> {
		if (!this.routesList) {
			throw new Error('Missing manifest data. This is an internal error, please file an issue.');
		}
		const { routeData, pathname, newUrl } = findRouteToRewrite({
			payload,
			request,
			routes: this.routesList?.routes,
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
			base: this.manifest.base,
			outDir: this.manifest.outDir,
		});

		const componentInstance = await this.getComponentByRoute(routeData);
		return { newUrl, pathname, componentInstance, routeData };
	}

	setManifestData(manifestData: RoutesList) {
		this.routesList = manifestData;
	}
}
