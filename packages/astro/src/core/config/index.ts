
export type {
	AstroConfigSchema
} from './schema';

export {
	openConfig,
	resolveConfigPath,
	resolveFlags,
	resolveRoot,
	validateConfig,
} from './config.js';

export {
	createSettings
} from './settings.js';

export {
	loadTSConfig
} from './tsconfig.js';
