import type { ImageServiceConfig } from 'astro';
import type { NapiImageServiceConfig } from './service.js';

export type { NapiImageServiceConfig } from './service.js';

/**
 * Returns the configuration for an image service that transforms images with
 * [`@napi-rs/image`](https://image.napi.rs).
 *
 * ```js
 * import { defineConfig } from 'astro/config';
 * import { napiImageService } from '@astrojs/image-napi';
 *
 * export default defineConfig({
 *   image: { service: napiImageService() },
 * });
 * ```
 */
export function napiImageService(
	config: NapiImageServiceConfig = {},
): ImageServiceConfig<NapiImageServiceConfig> {
	return {
		entrypoint: '@astrojs/image-napi/service',
		config,
	};
}
