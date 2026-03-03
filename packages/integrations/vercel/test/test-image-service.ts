import { fileURLToPath } from 'node:url';
import type { ImageServiceConfig } from '../../../astro/dist/types/public/config.js';
import {
	baseService,
	type LocalImageService,
} from '../../../astro/dist/assets/services/service.js';

/**
 * stub image service that returns images as-is without optimization
 */
export function testImageService(config: { foo?: string } = {}): ImageServiceConfig {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

export default {
	...baseService,
	propertiesToHash: [...baseService.propertiesToHash, 'data-custom'],
	getHTMLAttributes(options, serviceConfig) {
		options['data-service'] = 'my-custom-service';
		if (serviceConfig.service.config.foo) {
			options['data-service-config'] = serviceConfig.service.config.foo;
		}
		return baseService.getHTMLAttributes!(options, serviceConfig);
	},
	async transform(buffer, transform) {
		return {
			data: buffer,
			format: transform.format,
		};
	},
} satisfies LocalImageService;
