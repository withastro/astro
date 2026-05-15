import { Pipeline } from '../../base-pipeline.js';
import { ASTRO_VERSION } from '../../constants.js';
import { createModuleScriptElement, createStylesheetElementSet } from '../../render/ssr-element.js';
import { findRouteToRewrite } from '../../routing/rewrite.js';
import { newNodePool } from '../../../runtime/server/render/queue/pool.js';
import { HTMLStringCache } from '../../../runtime/server/html-string-cache.js';
import { queueRenderingEnabled } from '../manifest.js';
class NonRunnablePipeline extends Pipeline {
	getName() {
		return 'NonRunnablePipeline';
	}
	static create({ logger, manifest, streaming }) {
		async function resolve(specifier) {
			if (specifier.startsWith('/')) {
				return specifier;
			} else {
				return '/@id/' + specifier;
			}
		}
		const pipeline = new NonRunnablePipeline(
			logger,
			manifest,
			'development',
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
		if (queueRenderingEnabled(manifest.experimentalQueuedRendering)) {
			pipeline.nodePool = newNodePool(manifest.experimentalQueuedRendering);
			if (manifest.experimentalQueuedRendering.contentCache) {
				pipeline.htmlStringCache = new HTMLStringCache(1e3);
			}
		}
		return pipeline;
	}
	async headElements(routeData) {
		const { componentMetadataEntries } = await import('virtual:astro:component-metadata');
		for (const [id, entry] of componentMetadataEntries) {
			this.manifest.componentMetadata.set(id, entry);
		}
		const { assetsPrefix, base } = this.manifest;
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
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
				scripts.add(createModuleScriptElement(script));
			}
		}
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
				root: this.manifest.rootDir.toString(),
				version: ASTRO_VERSION,
				latestAstroVersion: this.manifest.devToolbar.latestAstroVersion,
				debugInfo: this.manifest.devToolbar.debugInfoOutput ?? '',
				placement: this.manifest.devToolbar.placement,
			};
			const children = `window.__astro_dev_toolbar__ = ${JSON.stringify(additionalMetadata)}`;
			scripts.add({ props: {}, children });
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
		for (const { id, url: src, content } of css) {
			scripts.add({ props: { type: 'module', src }, children: '' });
			styles.add({ props: { 'data-vite-dev-id': id }, children: content });
		}
		return { scripts, styles, links };
	}
	componentMetadata() {}
	async getComponentByRoute(routeData) {
		try {
			const module2 = await this.getModuleForRoute(routeData);
			return module2.page();
		} catch {}
		const url = new URL(routeData.component, this.manifest.rootDir);
		const module = await import(
			/* @vite-ignore */
			url.toString()
		);
		return module;
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
export { NonRunnablePipeline };
