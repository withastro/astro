import { baseService } from 'astro/assets';
import type { LocalImageService } from 'astro';

// Only defined when Vite bundles this module.
const base: string = import.meta.env.BASE_URL;

const service: LocalImageService = {
	...baseService,
	getHTMLAttributes(options, imageConfig, logger) {
		options['data-service-base'] = base;
		return baseService.getHTMLAttributes!(options, imageConfig, logger);
	},
	async transform(buffer, transform) {
		// Marks the output, so tests can tell this service generated the image.
		const marker = new TextEncoder().encode('ALIASED_TRANSFORM');
		const data = new Uint8Array(marker.length + buffer.length);
		data.set(marker);
		data.set(buffer, marker.length);
		return { data, format: transform.format };
	},
};

export default service;
