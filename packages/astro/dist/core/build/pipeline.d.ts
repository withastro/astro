import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData, SSRResult } from '../../types/public/internal.js';
import type { SSRManifest } from '../app/types.js';
import type { TryRewriteResult } from '../base-pipeline.js';
import { Pipeline } from '../base-pipeline.js';
import { type DefaultRouteParams } from '../routing/default.js';
import type { BuildInternals } from './internal.js';
import type { SinglePageBuiltModule, StaticBuildOptions } from './types.js';
/**
 * The build pipeline is responsible to gather the files emitted by the SSR build and generate the pages by executing these files.
 */
export declare class BuildPipeline extends Pipeline {
	#private;
	internals: BuildInternals | undefined;
	options: StaticBuildOptions | undefined;
	readonly manifest: SSRManifest;
	readonly defaultRoutes: Array<DefaultRouteParams>;
	getName(): string;
	getSettings(): import('../../types/astro.js').AstroSettings;
	getOptions(): StaticBuildOptions;
	getInternals(): BuildInternals;
	private constructor();
	getRoutes(): RouteData[];
	static create({ manifest }: Pick<BuildPipeline, 'manifest'>): BuildPipeline;
	setInternals(internals: BuildInternals): void;
	setOptions(options: StaticBuildOptions): void;
	headElements(routeData: RouteData): Pick<SSRResult, 'scripts' | 'styles' | 'links'>;
	componentMetadata(): void;
	/**
	 * It collects the routes to generate during the build.
	 * It returns a map of page information and their relative entry point as a string.
	 */
	retrieveRoutesToGenerate(): Set<RouteData>;
	getComponentByRoute(routeData: RouteData): Promise<ComponentInstance>;
	getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule>;
	tryRewrite(payload: RewritePayload, request: Request): Promise<TryRewriteResult>;
}
