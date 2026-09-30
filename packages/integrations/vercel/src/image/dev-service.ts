import type { LocalImageService } from 'astro';
import sharpService from 'astro/assets/services/sharp';
import { baseDevService } from './shared-dev-service.js';

const service: LocalImageService = {
	...baseDevService,
	getHTMLAttributes(options, ...args) {
		const { inputtedWidth, ...props } = options;

		// If `validateOptions` returned a different width than the one of the image, use it for attributes
		if (inputtedWidth) {
			props.width = inputtedWidth;
		}

		return sharpService.getHTMLAttributes ? sharpService.getHTMLAttributes(props, ...args) : {};
	},
	transform(...args) {
		const transform = args[1];
		// NOTE: Hardcoding webp here isn't accurate to how the Vercel Image Optimization API works, normally what we should
		// do is set up a custom endpoint that sniff the user's accept-content header and serve the proper format based on the
		// user's Vercel config. However, that's: a lot of work for: not much. The dev service is inaccurate to the prod service
		// in many more ways, this is one of the less offending cases and is, imo, okay, erika - 2023-04-27
		transform.format = transform.src.endsWith('svg') ? 'svg' : 'webp';

		// The base sharp service works the same way as the Vercel Image Optimization API, so it's a safe fallback in local
		return sharpService.transform(...args);
	},
};

export default service;
