import { fontProviders } from '../assets/fonts/providers/index.js';
import { mergeConfig } from '../core/config/merge.js';
import { validateConfig } from '../core/config/validate.js';
import { envField } from '../env/config.js';
import { defineConfig, getViteConfig } from './index.js';
import { sessionDrivers } from '../core/session/drivers.js';
import { svgoOptimizer } from '../assets/svg/svgo.js';
import { logHandlers } from '../core/logger/handlers.js';
function sharpImageService(config = {}) {
	return {
		entrypoint: 'astro/assets/services/sharp',
		config,
	};
}
function passthroughImageService() {
	return {
		entrypoint: 'astro/assets/services/noop',
		config: {},
	};
}
function memoryCache(config = {}) {
	return {
		name: 'memory',
		entrypoint: 'astro/cache/memory',
		config,
	};
}
export {
	defineConfig,
	envField,
	fontProviders,
	getViteConfig,
	logHandlers,
	memoryCache,
	mergeConfig,
	passthroughImageService,
	sessionDrivers,
	sharpImageService,
	svgoOptimizer,
	validateConfig,
};
