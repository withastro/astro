import { fileURLToPath } from 'node:url';
import { baseService } from '../dist/assets/services/service.js';

/**
 * stub image service that returns images as-is without optimization
 * @param {{ foo?: string }} [config]
 */
export function testImageService(config = {}) {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

/** @type {import("../dist/types/public/index.js").LocalImageService} */
