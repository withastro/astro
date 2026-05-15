import type { ComponentInstance } from '../../../types/astro.js';
import type { RewritePayload, RouteData } from '../../../types/public/index.js';
import { type HeadElements, Pipeline, type TryRewriteResult } from '../../base-pipeline.js';
type DevPipelineCreate = Pick<NonRunnablePipeline, 'logger' | 'manifest' | 'streaming'>;
/**
 * A pipeline that can't load modules at runtime using the vite environment APIs
 */
export declare class NonRunnablePipeline extends Pipeline {
	getName(): string;
	static create({ logger, manifest, streaming }: DevPipelineCreate): NonRunnablePipeline;
	headElements(routeData: RouteData): Promise<HeadElements>;
	componentMetadata(): void;
	getComponentByRoute(routeData: RouteData): Promise<ComponentInstance>;
	tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult>;
}
export {};
