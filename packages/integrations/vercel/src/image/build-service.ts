import type { ExternalImageService } from 'astro';
import { isESMImportedImage, sharedValidateOptions } from './shared';

const service: ExternalImageService = {
	validateOptions: (options, serviceOptions) =>
		sharedValidateOptions(options, serviceOptions, 'production'),
	getHTMLAttributes(options) {
		const { inputtedWidth, ...props } = options;

		// If `validateOptions` returned a different width than the one of the image, use it for attributes
		if (inputtedWidth) {
			props.width = inputtedWidth;
		}

		let targetWidth = props.width;
		let targetHeight = props.height;
		if (isESMImportedImage(props.src)) {
			const aspectRatio = props.src.width / props.src.height;
			if (targetHeight && !targetWidth) {
				// If we have a height but no width, use height to calculate the width
				targetWidth = Math.round(targetHeight * aspectRatio);
			} else if (targetWidth && !targetHeight) {
				// If we have a width but no height, use width to calculate the height
				targetHeight = Math.round(targetWidth / aspectRatio);
			} else if (!targetWidth && !targetHeight) {
				// If we have neither width or height, use the original image's dimensions
				targetWidth = props.src.width;
				targetHeight = props.src.height;
			}
		}

		const { src, width, height, format, quality, ...attributes } = props;

		return {
			...attributes,
			width: targetWidth,
			height: targetHeight,
			loading: attributes.loading ?? 'lazy',
			decoding: attributes.decoding ?? 'async',
		};
	},
	getURL(options) {
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
