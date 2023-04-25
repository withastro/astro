import type { ExternalImageService, ImageTransform } from 'astro';
import { sharedValidateOptions } from './shared';

const service: ExternalImageService = {
	validateOptions: (options) => sharedValidateOptions(options, {}, 'production'),
	getURL: function (options: ImageTransform): string {
		const fileSrc =
			typeof options.src === 'string' ? options.src : removeLeadingForwardSlash(options.src.src);

		const searchParams = new URLSearchParams();
		searchParams.append('url', fileSrc);

		options.width && searchParams.append('w', options.width.toString());
		options.quality && searchParams.append('q', options.quality.toString());

		return '/_vercel/image?' + searchParams;
	},
};

function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
}

export default service;
