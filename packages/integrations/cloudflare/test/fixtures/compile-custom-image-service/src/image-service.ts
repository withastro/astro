import type { LocalImageService } from 'astro';
import { baseService } from 'astro/assets';

const service: LocalImageService = {
	...baseService,
	async getURL(options, imageConfig) {
		const url = await baseService.getURL(options, imageConfig);
		if (url.startsWith('/')) {
			return `/cdn${url}`;
		}
		return url;
	},
	getHTMLAttributes(options, imageConfig) {
		const baseAttrs = baseService.getHTMLAttributes?.(options, imageConfig) ?? {};
		return {
			...baseAttrs,
			'data-image-service': 'custom',
		};
	},
	async transform(inputBuffer, transformOptions) {
		return { data: inputBuffer, format: transformOptions.format ?? 'webp' };
	},
};

export default service;
