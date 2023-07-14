export {
	createDefaultDevConfig,
	openConfig,
	resolveConfigPath,
	resolveConfig,
	resolveFlags,
	resolveRoot,
} from './config.js';
export { mergeConfig } from './merge.js';
export type { AstroConfigSchema } from './schema';
export { createDefaultDevSettings, createSettings } from './settings.js';
export { loadTSConfig, updateTSConfigForFramework } from './tsconfig.js';
