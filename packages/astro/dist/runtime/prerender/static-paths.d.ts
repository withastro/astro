import type { SSRManifest } from '../../core/app/types.js';
import type { Pipeline } from '../../core/base-pipeline.js';
import type { PathWithRoute } from '../../types/public/integrations.js';
export type { PathWithRoute } from '../../types/public/integrations.js';
/**
 * Minimal interface for what StaticPaths needs from an App.
 * This allows adapters to pass any App-like object (BuildApp, NodeApp, etc).
 */
export interface StaticPathsApp {
	manifest: SSRManifest;
	pipeline: Pick<Pipeline, 'routeCache' | 'getComponentByRoute'>;
}
/**
 * Collects all static paths for prerendering.
 * Handles calling getStaticPaths on each route and populating the route cache.
 */
export declare class StaticPaths {
	#private;
	constructor(app: StaticPathsApp);
	/**
	 * Get all static paths for prerendering with their associated routes.
	 * This avoids needing to re-match routes later, which can be incorrect due to route priority.
	 */
	getAll(): Promise<PathWithRoute[]>;
}
