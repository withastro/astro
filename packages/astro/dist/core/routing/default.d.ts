import type { ComponentInstance } from '../../types/astro.js';
import type { SSRManifest } from '../app/types.js';
export interface DefaultRouteParams {
	instance: ComponentInstance;
	matchesComponent(filePath: URL): boolean;
	route: string;
	component: string;
}
export declare const DEFAULT_COMPONENTS: string[];
export declare function createDefaultRoutes(manifest: SSRManifest): DefaultRouteParams[];
