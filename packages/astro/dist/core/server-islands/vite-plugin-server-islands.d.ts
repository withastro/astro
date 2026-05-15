import type { Plugin as VitePlugin } from 'vite';
import type { AstroPluginOptions } from '../../types/astro.js';
import type { ServerIslandsState } from './shared-state.js';
export declare const SERVER_ISLAND_MANIFEST = 'virtual:astro:server-island-manifest';
export declare const SERVER_ISLAND_MAP_MARKER = '$$server-islands-map$$';
export declare function vitePluginServerIslands({
	settings,
	serverIslandsState,
}: AstroPluginOptions & {
	serverIslandsState: ServerIslandsState;
}): VitePlugin;
