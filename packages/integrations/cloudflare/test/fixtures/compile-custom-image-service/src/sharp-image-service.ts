import type { LocalImageService } from 'astro';
import sharpService from 'astro/assets/services/sharp';

const service: LocalImageService = {
	...sharpService,

	getHTMLAttributes(options, config) {
		const attrs = sharpService.getHTMLAttributes?.(options, config) ?? {};
		return { ...attrs, 'data-image-service': 'custom-sharp' };
	},
};

export default service;
