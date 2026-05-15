import type { VitePlugin } from '../utils.js';
type VitePluginDBClientParams = {
	connectToRemote: boolean;
	mode: 'node' | 'web';
};
export declare function vitePluginDbClient(params: VitePluginDBClientParams): VitePlugin;
export {};
