import type { RouteData, SSRElement, SSRResult } from '../../@types/astro.js';
import { Pipeline } from '../base-pipeline.js';
import { createModuleScriptElement, createStylesheetElementSet } from '../render/ssr-element.js';

export class AppPipeline extends Pipeline {
	static create({
		logger,
		manifest,
		mode,
		renderers,
		resolve,
		serverLike,
		streaming,
	}: Pick<
		AppPipeline,
		'logger' | 'manifest' | 'mode' | 'renderers' | 'resolve' | 'serverLike' | 'streaming'
	>) {
		return new AppPipeline(logger, manifest, mode, renderers, resolve, serverLike, streaming);
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
}
