import type { Plugin } from 'vite';
import type { RoutesList } from '../types/astro.js';
interface AstroVitePluginOptions {
	routesList: RoutesList;
	command: 'dev' | 'build';
}
/**
 * This plugin tracks the CSS that should be applied by route.
 *
 * The virtual module should be used only during development.
 * Per-route virtual modules are created to avoid invalidation loops.
 *
 * The second plugin imports all of the individual CSS modules in a map.
 *
 * @param routesList
 */
export declare function astroDevCssPlugin({
	routesList,
	command,
}: AstroVitePluginOptions): Plugin[];
export {};
