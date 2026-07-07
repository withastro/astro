import type { LocalImageService } from 'astro';
import { baseService } from 'astro/assets';

export const TRANSFORM_MARKER = 'CUSTOM_TRANSFORM_RAN';

const service: LocalImageService = {
	...baseService,

	getHTMLAttributes(options, config) {
		const attrs = baseService.getHTMLAttributes?.(options, config) ?? {};
		return { ...attrs, 'data-image-service': 'custom' };
	},

	async transform(inputBuffer, transformOptions, config) {
		const marker = new TextEncoder().encode(`${TRANSFORM_MARKER}\n`);
		const data = new Uint8Array(marker.length + inputBuffer.length);
		data.set(marker, 0);
		data.set(inputBuffer, marker.length);
		return { data, format: transformOptions.format ?? 'png' };
	},
};

export default service;
