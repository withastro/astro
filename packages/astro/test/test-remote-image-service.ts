import { fileURLToPath } from 'node:url';
import { baseService } from '../dist/assets/services/service.js';
import type { LocalImageService } from '../dist/types/public/index.js';

interface TestRemoteImageServiceConfig {
	foo?: string;
}

/** stub remote image service */
export function testRemoteImageService(config: TestRemoteImageServiceConfig = {}) {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

const service: Omit<LocalImageService, 'transform'> = {
	...baseService,
	propertiesToHash: [...(baseService.propertiesToHash ?? []), 'data-custom'],
	getHTMLAttributes(options, serviceConfig) {
		options['data-service'] = 'my-custom-service';
		if (serviceConfig.service.config.foo) {
			options['data-service-config'] = serviceConfig.service.config.foo;
		}
		return baseService.getHTMLAttributes!(options, serviceConfig);
	},
};

export default service;
