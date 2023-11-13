import type { ExternalImageService } from 'astro';

import { baseService } from 'astro/assets';
import { isESMImportedImage, isRemoteAllowed, joinPaths } from '../utils/assets.js';

const service: ExternalImageService = {
	...baseService,
	getURL: (options, imageConfig) => {
		const resizingParams = [];
		if (options.width) resizingParams.push(`width=${options.width}`);
		if (options.height) resizingParams.push(`height=${options.height}`);
		if (options.quality) resizingParams.push(`quality=${options.quality}`);
		if (options.fit) resizingParams.push(`fit=${options.fit}`);
		if (options.format) resizingParams.push(`format=${options.format}`);

		let imageSource = '';
		if (isESMImportedImage(options.src)) {
			imageSource = options.src.src;
		} else if (isRemoteAllowed(options.src, imageConfig)) {
			imageSource = options.src;
		} else {
			// If it's not an imported image, nor is it allowed using the current domains or remote patterns, we'll just return the original URL
			return options.src;
		}

		const imageEndpoint = joinPaths(
			// @ts-expect-error - Property 'env' does not exist on type 'ImportMeta'.ts(2339)
			import.meta.env.BASE_URL,
			'/cdn-cgi/image',
			resizingParams.join(','),
			imageSource
		);

		return imageEndpoint;
	},
};

export default service;
