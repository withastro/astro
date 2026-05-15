import type * as vite from 'vite';
import type { EnvLoader } from './env-loader.js';
interface EnvPluginOptions {
	envLoader: EnvLoader;
}
export declare function importMetaEnv({ envLoader }: EnvPluginOptions): vite.Plugin;
export {};
