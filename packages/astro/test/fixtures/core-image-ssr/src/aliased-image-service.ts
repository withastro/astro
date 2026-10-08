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
		return { data: buffer, format: transform.format };
	},
};

export default service;
