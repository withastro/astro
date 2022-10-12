export {
	openConfig,
	resolveConfigPath,
	resolveFlags,
	resolveRoot,
	validateConfig,
} from './config.js';
export type { AstroConfigSchema } from './schema';
export { createSettings } from './settings.js';
export { loadTSConfig, updateTSConfigForFramework } from './tsconfig.js';
