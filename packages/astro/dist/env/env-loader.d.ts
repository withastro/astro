import type { AstroConfig } from '../types/public/index.js';
interface EnvLoaderOptions {
	mode: string;
	config: AstroConfig;
}
export declare const createEnvLoader: (options: EnvLoaderOptions) => {
	get: () => Record<string, string>;
	getPrivateEnv: () => Record<string, string>;
};
export type EnvLoader = ReturnType<typeof createEnvLoader>;
export {};
