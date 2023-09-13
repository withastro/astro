import type { LocalImageService } from 'astro';
import squooshService from 'astro/assets/services/squoosh';
import { sharedValidateOptions } from './shared.js';

const service: LocalImageService = {
	validateOptions: (options, serviceOptions) =>
		sharedValidateOptions(options, serviceOptions.service.config, 'development'),
	getHTMLAttributes(options, serviceOptions) {
		const { inputtedWidth, ...props } = options;

		// If `validateOptions` returned a different width than the one of the image, use it for attributes
		if (inputtedWidth) {
			props.width = inputtedWidth;
		}

		return squooshService.getHTMLAttributes
			? squooshService.getHTMLAttributes(props, serviceOptions)
			: {};
	},
	getURL(options) {
		const fileSrc = typeof options.src === 'string' ? options.src : options.src.src;

		const searchParams = new URLSearchParams();
		searchParams.append('href', fileSrc);

		options.width && searchParams.append('w', options.width.toString());
		options.quality && searchParams.append('q', options.quality.toString());

		return '/_image?' + searchParams;
	},
	parseURL(url) {
		const params = url.searchParams;

		if (!params.has('href')) {
			return undefined;
		}

		const transform = {
			src: params.get('href')!,
			width: params.has('w') ? parseInt(params.get('w')!) : undefined,
			quality: params.get('q'),
		};

		return transform;
	},
	transform(inputBuffer, transform, serviceOptions) {
		// NOTE: Hardcoding webp here isn't accurate to how the Vercel Image Optimization API works, normally what we should
		// do is setup a custom endpoint that sniff the user's accept-content header and serve the proper format based on the
		// user's Vercel config. However, that's: a lot of work for: not much. The dev service is inaccurate to the prod service
		// in many more ways, this is one of the less offending cases and is, imo, okay, erika - 2023-04-27
		transform.format = 'webp';

		// The base Squoosh service works the same way as the Vercel Image Optimization API, so it's a safe fallback in local
		return squooshService.transform(inputBuffer, transform, serviceOptions);
	},
};

export default service;
