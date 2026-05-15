import type { PluginOption } from 'vite';
export interface CompileImageConfig {
	base: string;
	assetsPrefix: string | undefined;
	imageServiceEntrypoint: string;
	buildAssets: string;
}
export interface Config {
	sessionKVBindingName: string;
	compileImageConfig: CompileImageConfig | null;
	isPrerender: boolean;
}
export declare function createConfigPlugin(config: Omit<Config, 'isPrerender'>): PluginOption;
