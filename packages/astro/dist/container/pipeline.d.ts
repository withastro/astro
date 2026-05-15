import { type HeadElements, Pipeline, type TryRewriteResult } from '../core/base-pipeline.js';
import type { ComponentInstance } from '../types/astro.js';
import type { RewritePayload } from '../types/public/common.js';
import type { RouteData, SSRResult } from '../types/public/internal.js';
export declare class ContainerPipeline extends Pipeline {
	#private;
	getName(): string;
	static create({
		logger,
		manifest,
		renderers,
		resolve,
		streaming,
	}: Pick<
		ContainerPipeline,
		'logger' | 'manifest' | 'renderers' | 'resolve' | 'streaming'
	>): ContainerPipeline;
	componentMetadata(_routeData: RouteData): Promise<SSRResult['componentMetadata']> | void;
	headElements(routeData: RouteData): Promise<HeadElements> | HeadElements;
	tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult>;
	insertRoute(route: RouteData, componentInstance: ComponentInstance): void;
	getComponentByRoute(routeData: RouteData): Promise<ComponentInstance>;
}
