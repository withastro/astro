import { fileURLToPath } from 'node:url';
import { Pipeline } from '../core/base-pipeline.js';
import { ASTRO_VERSION } from '../core/constants.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';
import { AggregateError, CSSError, MarkdownError } from '../core/errors/index.js';
import { RedirectComponentInstance } from '../core/redirects/index.js';
import { loadRenderer } from '../core/render/index.js';
import { routeIsRedirect } from '../core/routing/helpers.js';
import { findRouteToRewrite } from '../core/routing/rewrite.js';
import { isPage } from '../core/util.js';
import { getComponentMetadata } from '../vite-plugin-astro-server/metadata.js';
import { createResolve } from '../vite-plugin-astro-server/resolve.js';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';
import { newNodePool } from '../runtime/server/render/queue/pool.js';
import { HTMLStringCache } from '../runtime/server/html-string-cache.js';
import { queueRenderingEnabled } from '../core/app/manifest.js';
class RunnablePipeline extends Pipeline {
	getName() {
		return 'RunnablePipeline';
	}
	// renderers are loaded on every request,
	// so it needs to be mutable here unlike in other environments
	renderers = new Array();
	routesList;
	loader;
	settings;
	getDebugInfo;
	constructor(loader, logger, manifest, settings, getDebugInfo, defaultRoutes) {
		const resolve = createResolve(loader, manifest.rootDir);
		const streaming = true;
		super(
			logger,
			manifest,
			'development',
			[],
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
			defaultRoutes,
		);
		this.loader = loader;
		this.settings = settings;
		this.getDebugInfo = getDebugInfo;
	}
	static create(manifestData, { loader, logger, manifest, settings, getDebugInfo }) {
		const pipeline = new RunnablePipeline(loader, logger, manifest, settings, getDebugInfo);
		pipeline.routesList = manifestData;
		if (queueRenderingEnabled(manifest.experimentalQueuedRendering)) {
			pipeline.nodePool = newNodePool(manifest.experimentalQueuedRendering);
			if (manifest.experimentalQueuedRendering.contentCache) {
				pipeline.htmlStringCache = new HTMLStringCache(1e3);
			}
		}
		return pipeline;
	}
	async headElements(routeData) {
		const { manifest, runtimeMode, settings } = this;
		const filePath = new URL(`${routeData.component}`, manifest.rootDir);
		const scripts = /* @__PURE__ */ new Set();
		if (settings) {
			if (isPage(filePath, settings) && runtimeMode === 'development') {
				scripts.add({
					props: { type: 'module', src: '/@vite/client' },
					children: '',
				});
				if (this.manifest.devToolbar.enabled) {
					scripts.add({
						props: {
							type: 'module',
							src: '/@id/astro/runtime/client/dev-toolbar/entrypoint.js',
						},
						children: '',
					});
					const additionalMetadata = {
						root: fileURLToPath(settings.config.root),
						version: ASTRO_VERSION,
						latestAstroVersion: settings.latestAstroVersion,
						// TODO: Currently the debug info is always fetched, which slows things down.
						// We should look into not loading it if the dev toolbar is disabled. And when
						// enabled, it would nice to request the debug info through import.meta.hot
						// when the button is click to defer execution as much as possible
						debugInfo: await this.getDebugInfo(),
						placement: settings.config.devToolbar.placement,
					};
					const children = `window.__astro_dev_toolbar__ = ${JSON.stringify(additionalMetadata)}`;
					scripts.add({ props: {}, children });
				}
			}
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
		let css = /* @__PURE__ */ new Set();
		if (importer) {
			const cssModule = await importer();
			css = cssModule.css;
		} else {
			this.logger.warn(
				'assets',
				`Unable to find CSS for ${routeData.component}. This is likely a bug in Astro.`,
			);
		}
		const links = /* @__PURE__ */ new Set();
		const styles = /* @__PURE__ */ new Set();
		for (const { id, url: src, content } of css) {
			scripts.add({ props: { type: 'module', src }, children: '' });
			styles.add({ props: { 'data-vite-dev-id': id }, children: content });
		}
		return { scripts, styles, links };
	}
	componentMetadata(routeData) {
		const filePath = new URL(`${routeData.component}`, this.manifest.rootDir);
		return getComponentMetadata(filePath, this.loader);
	}
	async preload(routeData, filePath) {
		if (routeIsRedirect(routeData)) {
			return RedirectComponentInstance;
		}
		const { loader } = this;
		for (const route of this.defaultRoutes) {
			if (route.matchesComponent(filePath)) {
				return route.instance;
			}
		}
		if (this.settings) {
			const renderers__ = this.settings.renderers.map((r) => loadRenderer(r, loader));
			const renderers_ = await Promise.all(renderers__);
			this.renderers = renderers_.filter((r) => Boolean(r));
		}
		try {
			return await loader.import(filePath.toString());
		} catch (error) {
			if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
				throw error;
			}
			throw enhanceViteSSRError({ error, filePath, loader });
		}
	}
	clearRouteCache() {
		this.routeCache.clearAll();
	}
	async getComponentByRoute(routeData) {
		const filePath = new URL(`${routeData.component}`, this.manifest.rootDir);
		return await this.preload(routeData, filePath);
	}
	async tryRewrite(payload, request) {
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
	setManifestData(manifestData) {
		this.routesList = manifestData;
	}
}
export { RunnablePipeline };
