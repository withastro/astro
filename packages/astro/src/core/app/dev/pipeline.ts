import type { ComponentInstance } from '../../../types/astro.js';
import type {
	RewritePayload,
	RouteData,
	SSRElement,
	SSRResult,
} from '../../../types/public/index.js';
import { Pipeline, type TryRewriteResult } from '../../base-pipeline.js';
import { createModuleScriptElement, createStylesheetElementSet } from '../../render/ssr-element.js';
import { findRouteToRewrite } from '../../routing/rewrite.js';

export class DevPipeline extends Pipeline {
	static create({
		logger,
		manifest,
		streaming,
	}: Pick<DevPipeline, 'logger' | 'manifest' | 'streaming'>) {
		const resolve = async function resolve(specifier: string) {
			if (specifier.startsWith('/')) {
				return specifier;
			} else {
				return '/@id/' + specifier;
			}
		};
		const pipeline = new DevPipeline(
			logger,
			manifest,
			'production',
			manifest.renderers,
			resolve,
			true,
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

	headElements(routeData: RouteData): Pick<SSRResult, 'scripts' | 'styles' | 'links'> {
		const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
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
			outDir: this.serverLike ? this.manifest.buildClientDir : this.manifest.outDir,
		});

		const componentInstance = await this.getComponentByRoute(routeData);
		return { newUrl, pathname, componentInstance, routeData };
	}
}
