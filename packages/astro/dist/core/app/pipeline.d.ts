import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { type HeadElements, Pipeline, type TryRewriteResult } from '../base-pipeline.js';
import type { SinglePageBuiltModule } from '../build/types.js';
export declare class AppPipeline extends Pipeline {
	getName(): string;
	static create({ manifest, streaming }: Pick<AppPipeline, 'manifest' | 'streaming'>): AppPipeline;
	headElements(routeData: RouteData): Promise<HeadElements>;
	componentMetadata(): void;
	getComponentByRoute(routeData: RouteData): Promise<ComponentInstance>;
	getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule>;
	tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult>;
}
