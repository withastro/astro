import type { PluginOption } from 'vite';
export interface Config {
	middlewareSecret: string;
	skewProtection: boolean;
}
export declare function createConfigPlugin(config: Config): PluginOption;
