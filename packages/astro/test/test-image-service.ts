import { fileURLToPath } from 'node:url';
import { baseService } from '../dist/assets/services/service.js';
import type { LocalImageService } from '../dist/types/public/index.js';

interface TestImageServiceConfig {
	foo?: string;
	transform?: { path: string; scale: number };
}

/**
 * stub image service that returns images as-is without optimization
 */
export function testImageService(config: TestImageServiceConfig = {}) {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

const service: LocalImageService<TestImageServiceConfig> = {
	...baseService,
	propertiesToHash: [...(baseService.propertiesToHash ?? []), 'data-custom'],
	getHTMLAttributes(options, serviceConfig, logger) {
		options['data-service'] = 'my-custom-service';
		if (serviceConfig.service.config.foo) {
			options['data-service-config'] = serviceConfig.service.config.foo;
		}
		return baseService.getHTMLAttributes!(options, serviceConfig, logger);
	},
	async transform(buffer, transform) {
		return {
			data: buffer,
			format: transform.format,
		};
	},
	async getRemoteSize(url, serviceConfig, logger) {
		const baseSize = await baseService.getRemoteSize!(url, serviceConfig, logger);

		if (serviceConfig.service.config.transform?.path === url) {
			const scale = serviceConfig.service.config.transform.scale;
			return { ...baseSize, width: baseSize.width * scale, height: baseSize.height * scale };
		}

		return baseSize;
	},
};

export default service;
