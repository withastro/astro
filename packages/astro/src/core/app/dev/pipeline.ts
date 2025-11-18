import type { ComponentInstance } from '../../../types/astro.js';
import type {
	DevToolbarMetadata,
	RewritePayload,
	RouteData,
	SSRElement,
} from '../../../types/public/index.js';
import { getVirtualModulePageName } from '../../../vite-plugin-pages/util.js';
import { type HeadElements, Pipeline, type TryRewriteResult } from '../../base-pipeline.js';
import { ASTRO_VERSION } from '../../constants.js';
import { createModuleScriptElement, createStylesheetElementSet } from '../../render/ssr-element.js';
import { findRouteToRewrite } from '../../routing/rewrite.js';

type DevPipelineCreate = Pick<DevPipeline, 'logger' | 'manifest' | 'streaming'>;

export class DevPipeline extends Pipeline {
	getName(): string {
		return 'DevPipeline';
	}

	static create({ logger, manifest, streaming }: DevPipelineCreate) {
		async function resolve(specifier: string): Promise<string> {
			if (specifier.startsWith('/')) {
				return specifier;
			} else {
				return '/@id/' + specifier;
			}
		}

		const pipeline = new DevPipeline(
			logger,
			manifest,
			'production',
			manifest.renderers,
			resolve,
			streaming,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
		);
		return pipeline;
	}

	async headElements(routeData: RouteData): Promise<HeadElements> {
		const { assetsPrefix, base } = this.manifest;
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
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

		if (this.manifest.devToolbar.enabled) {
			scripts.add({
				props: {
					type: 'module',
					src: '/@id/astro/runtime/client/dev-toolbar/entrypoint.js',
				},
				children: '',
			});

			const additionalMetadata: DevToolbarMetadata['__astro_dev_toolbar__'] = {
				root: this.manifest.rootDir.toString(),
				version: ASTRO_VERSION,
				latestAstroVersion: this.manifest.devToolbar.latestAstroVersion,
				debugInfo: this.manifest.devToolbar.debugInfoOutput ?? '',
			};

			// Additional data for the dev overlay
			const children = `window.__astro_dev_toolbar__ = ${JSON.stringify(additionalMetadata)}`;
			scripts.add({ props: {}, children });
		}

		const { css } = await import(getVirtualModulePageName('virtual:astro:dev-css:', routeData.component));

		// Pass framework CSS in as style tags to be appended to the page.
		for (const { id, url: src, content } of css) {
			// Vite handles HMR for styles injected as scripts
			scripts.add({ props: { type: 'module', src }, children: '' });
			// But we still want to inject the styles to avoid FOUC. The style tags
			// should emulate what Vite injects so further HMR works as expected.
			styles.add({ props: { 'data-vite-dev-id': id }, children: content });
		}

		return { scripts, styles, links };
	}

	componentMetadata() {}

	async getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		try {
			const module = await this.getModuleForRoute(routeData);
			return module.page();
		} catch {
			// could not find, ignore
		}

		const url = new URL(routeData.component, this.manifest.rootDir);
		const module = await import(/* @vite-ignore */ url.toString());
		return module;
	}

	async tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult> {
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
