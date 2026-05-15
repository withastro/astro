import type { Plugin as VitePlugin } from 'vite';
import type { RoutesList } from '../types/astro.js';
interface PagePluginOptions {
	routesList: RoutesList;
}
export declare function pluginPage({ routesList }: PagePluginOptions): VitePlugin;
export {};
