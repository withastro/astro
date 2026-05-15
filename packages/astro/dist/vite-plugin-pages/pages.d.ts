import type { Plugin as VitePlugin } from 'vite';
import type { RoutesList } from '../types/astro.js';
export declare const VIRTUAL_PAGES_MODULE_ID = 'virtual:astro:pages';
interface PagesPluginOptions {
	routesList: RoutesList;
}
export declare function pluginPages({ routesList }: PagesPluginOptions): VitePlugin;
export {};
