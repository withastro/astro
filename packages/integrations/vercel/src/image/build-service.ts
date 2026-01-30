import type { ExternalImageService } from 'astro';
import { baseService } from 'astro/assets';
import { isESMImportedImage } from 'astro/assets/utils';
import { sharedValidateOptions, type VercelImageConfig } from './shared.js';

const service: ExternalImageService = {
	...baseService,
	validateOptions: (options, serviceOptions) =>
		sharedValidateOptions(options, serviceOptions.service.config, 'production'),
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

		const { src, width, height, format, quality, densities, widths, formats, ...attributes } =
			options;

		return {
			...attributes,
			width: targetWidth,
			height: targetHeight,
			loading: attributes.loading ?? 'lazy',
			decoding: attributes.decoding ?? 'async',
		};
	},
	getURL(options) {
		// For SVG files, return the original source path
		if (isESMImportedImage(options.src) && options.src.format === 'svg') {
			return options.src.src;
		}

		// For non-SVG files, continue with the Vercel image processing
		const fileSrc = isESMImportedImage(options.src)
			? removeLeadingForwardSlash(options.src.src)
			: options.src;

		const searchParams = new URLSearchParams();
		searchParams.append('url', fileSrc);

		options.width && searchParams.append('w', options.width.toString());
		options.quality && searchParams.append('q', options.quality.toString());

		return '/_vercel/image?' + searchParams;
	},
	// Adapted from the base service's getSrcSet, but always returning widths that are valid for Vercel,
	// meaning they're in the list of configured sizes. See sharedValidateOptions in shared.ts for more info.
	getSrcSet(options, imageConfig) {
		const { inputtedWidth, densities, widths, ...props } = options;

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

		// Since `widths` and `densities` ultimately control the width and height of the image,
		// we don't want the dimensions the user specified, we'll create those ourselves.
		const {
			width: transformWidth,
			height: transformHeight,
			...transformWithoutDimensions
		} = options;

		// Get the configured sizes from the Vercel image config
		const vercelConfig = imageConfig.service.config as VercelImageConfig;
		const configuredWidths = (vercelConfig.sizes ?? []).sort((a: number, b: number) => a - b);

		// Collect widths to generate from specified densities or widths
		let allWidths: Array<{
			width: number;
			descriptor: `${number}x` | `${number}w`;
		}> = [];

		if (densities) {
			// Densities can either be specified as numbers, or descriptors (ex: '1x'), we'll convert them all to numbers
			const densityValues = densities.map((density) => {
				if (typeof density === 'number') {
					return density;
				} else {
					return parseFloat(density);
				}
			});

			// Calculate the widths for each density, rounding to avoid floats.
			const calculatedWidths = densityValues
				.sort((a, b) => a - b)
				.map((density) => Math.round(targetWidth! * density));

			// Vercel only supports a fixed set of widths, so map each calculated width to the nearest configured width
			const sortedDensityValues = densityValues.sort((a, b) => a - b);
			allWidths = calculatedWidths.map((width, index) => {
				// Check if this width is already in the configured widths
				if (configuredWidths.includes(width)) {
					return {
						width,
						descriptor: `${sortedDensityValues[index]}x`,
					};
				}
				// Otherwise, find the nearest configured width
				const nearestWidth = configuredWidths.reduce((prev, curr) => {
					return Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev;
				});
				return {
					width: nearestWidth,
					descriptor: `${sortedDensityValues[index]}x`,
				};
			});

			// Dedupe widths but keep all density descriptors by grouping
			const widthToDescriptors = new Map<number, string[]>();
			for (const { width, descriptor } of allWidths) {
				if (!widthToDescriptors.has(width)) {
					widthToDescriptors.set(width, []);
				}
				widthToDescriptors.get(width)!.push(descriptor);
			}

			// Convert back to allWidths, keeping only unique widths
			allWidths = Array.from(widthToDescriptors.entries()).map(([width, descriptors]) => ({
				width,
				descriptor: descriptors[0] as `${number}x` | `${number}w`,
			}));
		} else if (widths?.length) {
			allWidths = widths.map((width) => ({
				width,
				descriptor: `${width}w`,
			}));
		}

		return allWidths.map(({ width, descriptor }) => {
			const transform = { ...transformWithoutDimensions, width };
			return {
				transform,
				descriptor,
			};
		});
	},
};

function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
}

export default service;
