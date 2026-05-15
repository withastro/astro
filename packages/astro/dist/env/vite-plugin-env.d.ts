import type { Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import type { EnvLoader } from './env-loader.js';
interface AstroEnvPluginParams {
	settings: AstroSettings;
	sync: boolean;
	envLoader: EnvLoader;
}
export declare function astroEnv({ settings, sync, envLoader }: AstroEnvPluginParams): Plugin;
export {};
