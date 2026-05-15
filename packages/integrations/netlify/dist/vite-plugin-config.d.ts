import type { PluginOption } from 'vite';
export interface Config {
	middlewareSecret: string;
	cacheOnDemandPages: boolean;
}
export declare function createConfigPlugin(config: Config): PluginOption;
