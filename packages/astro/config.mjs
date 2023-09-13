export { defineConfig, getViteConfig } from './dist/config/index.js';

export function sharpImageService() {
	return {
		entrypoint: 'astro/assets/services/sharp',
		config: {},
	};
}

export function squooshImageService() {
	return {
		entrypoint: 'astro/assets/services/squoosh',
		config: {},
	};
}

export function passthroughImageService() {
	return {
		entrypoint: 'astro/assets/services/noop',
		config: {},
	};
}
