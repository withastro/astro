import { type HeadElements, Pipeline } from '../core/base-pipeline.js';
import type { RouteData, SSRResult } from '../@types/astro.js';

export class TestPipeline extends Pipeline {
	static create({
		logger,
		manifest,
		mode,
		renderers,
		resolve,
		serverLike,
		streaming,
	}: Pick<
		TestPipeline,
		'logger' | 'manifest' | 'mode' | 'renderers' | 'resolve' | 'serverLike' | 'streaming'
	>) {
		return new TestPipeline(logger, manifest, mode, renderers, resolve, serverLike, streaming);
	}

	componentMetadata(_routeData: RouteData): Promise<SSRResult['componentMetadata']> | void {}

	headElements(_routeData: RouteData): Promise<HeadElements> | HeadElements {
		return {
			links: new Set(),
			scripts: new Set(),
			styles: new Set(),
		};
	}
}
