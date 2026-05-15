import type { ComponentInstance, RoutesList } from '../../types/astro.js';
import type { SSRManifest } from '../../types/public/internal.js';
export declare const SERVER_ISLAND_ROUTE = '/_server-islands/[name]';
export declare const SERVER_ISLAND_COMPONENT = '_server-islands.astro';
type ConfigFields = Pick<SSRManifest, 'base' | 'trailingSlash'>;
export declare function injectServerIslandRoute(
	config: ConfigFields,
	routeManifest: RoutesList,
): void;
export type RenderOptions = {
	encryptedComponentExport: string;
	encryptedProps: string;
	encryptedSlots: string;
};
export declare function getRequestData(
	request: Request,
	bodySizeLimit?: number,
): Promise<Response | RenderOptions>;
export declare function createEndpoint(manifest: SSRManifest): ComponentInstance;
export {};
