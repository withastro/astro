import type { SharpImageServiceConfig } from '../assets/services/sharp.js';
import type { ImageServiceConfig } from '../types/public/index.js';

export { defineConfig, getViteConfig } from './index.js';
export { envField } from '../env/config.js';

export function sharpImageService(config: SharpImageServiceConfig = {}): ImageServiceConfig {
	return {
		entrypoint: 'astro/assets/services/sharp',
		config,
	};
}

export function passthroughImageService(): ImageServiceConfig {
	return {
		entrypoint: 'astro/assets/services/noop',
		config: {},
	};
}
