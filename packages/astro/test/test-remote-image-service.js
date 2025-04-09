import { fileURLToPath } from 'node:url';
import { baseService } from '../dist/assets/services/service.js';

/**
 * stub remote image service
 * @param {{ foo?: string }} [config]
 */
export function testRemoteImageService(config = {}) {
	return {
		entrypoint: fileURLToPath(import.meta.url),
		config,
	};
}

/** @type {import("../dist/types/public/index.js").LocalImageService} */
