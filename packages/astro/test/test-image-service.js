import { fileURLToPath } from 'node:url';
import { baseService } from '../dist/assets/services/service.js';

/**
 * stub image service that returns images as-is without optimization
 * @param {{ foo?: string, transform?: { path: string, scale: number } }} [config]
 */
export function testImageService(config = {}) {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

/**
 * @type {import("../dist/types/public/index.js").LocalImageService}
 * @lintignore
 * */
export default {
	...baseService,
	propertiesToHash: [...baseService.propertiesToHash, 'data-custom'],
	getHTMLAttributes(options, serviceConfig) {
		options['data-service'] = 'my-custom-service';
		if (serviceConfig.service.config.foo) {
			options['data-service-config'] = serviceConfig.service.config.foo;
		}
		return baseService.getHTMLAttributes(options);
	},
	async transform(buffer, transform) {
		return {
			data: buffer,
			format: transform.format,
		};
	},
	async getRemoteSize(url, serviceConfig) {
		const baseSize = await baseService.getRemoteSize(url, serviceConfig);

		if (serviceConfig.service.config.transform?.path === url) {
			const scale = serviceConfig.service.config.transform.scale;
			return { ...baseSize, width: baseSize.width * scale, height: baseSize.height * scale };
		}

		return baseSize;
	},
};
