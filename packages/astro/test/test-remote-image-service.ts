import { fileURLToPath } from 'node:url';
import { baseService } from '../dist/assets/services/service.js';
import type { ExternalImageService } from '../dist/assets/services/service.js';
import type { ImageServiceConfig } from '../dist/index.js';

export function testRemoteImageService(config: { foo?: string } = {}): ImageServiceConfig {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

/**
 * @lintignore
 * */
export default {
	...baseService,
	getHTMLAttributes(options, serviceConfig) {
		options['data-service'] = 'my-custom-service';
		if (serviceConfig.service.config.foo) {
			options['data-service-config'] = serviceConfig.service.config.foo;
		}
		return baseService.getHTMLAttributes!(options, serviceConfig);
	},
} satisfies ExternalImageService;
