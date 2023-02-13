import type { ExternalImageService, ImageTransform } from 'astro';

const service: ExternalImageService = {
	getURL: (options: ImageTransform) =>
		`/_vercel/image?url=${options.src}&w=${options.width}&q=${options.quality}`,
	getAdditionalAttributes: () => ({
		srcset: 'woow!',
	}),
};

export default service;
