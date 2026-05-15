import type { ConfigEnv, Plugin as VitePlugin } from 'vite';
import type { ServerIslandsState } from '../core/server-islands/shared-state.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
export declare const ASTRO_RENDERERS_MODULE_ID = 'virtual:astro:renderers';
interface PluginOptions {
	settings: AstroSettings;
	routesList: RoutesList;
	serverIslandsState: ServerIslandsState;
	command: ConfigEnv['command'];
}
export default function vitePluginRenderers(options: PluginOptions): VitePlugin;
export {};
