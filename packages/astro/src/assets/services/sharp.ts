import type { FitEnum, FormatEnum, ResizeOptions, SharpOptions } from 'sharp';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ImageFit, ImageOutputFormat, ImageQualityPreset } from '../types.js';
import {
	type BaseServiceTransform,
	baseService,
	type LocalImageService,
	parseQuality,
} from './service.js';

export interface SharpImageServiceConfig {
	/**
	 * The `limitInputPixels` option passed to Sharp. See https://sharp.pixelplumbing.com/api-constructor for more information
	 */
	limitInputPixels?: SharpOptions['limitInputPixels'];

	/**
	 * The `kernel` option is passed to resize calls. See https://sharp.pixelplumbing.com/api-resize/ for more information
	 */
	kernel?: ResizeOptions['kernel'];
}

let sharp: typeof import('sharp');

const qualityTable: Record<ImageQualityPreset, number> = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};

async function loadSharp() {
	let sharpImport: typeof import('sharp');
	try {
		sharpImport = (await import('sharp')).default;
	} catch {
		throw new AstroError(AstroErrorData.MissingSharp);
	}

	// Disable the `sharp` `libvips` cache as it errors when the file is too small and operations are happening too fast (runs into a race condition) https://github.com/lovell/sharp/issues/3935#issuecomment-1881866341
	sharpImport.cache(false);

	return sharpImport;
}

const fitMap: Record<ImageFit, keyof FitEnum> = {
	fill: 'fill',
	contain: 'inside',
	cover: 'cover',
	none: 'outside',
	'scale-down': 'inside',
	outside: 'outside',
	inside: 'inside',
};

const sharpService: LocalImageService<SharpImageServiceConfig> = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	getSrcSet: baseService.getSrcSet,
	async transform(inputBuffer, transformOptions, config) {
		if (!sharp) sharp = await loadSharp();
		const transform: BaseServiceTransform = transformOptions as BaseServiceTransform;
		const kernel = config.service.config.kernel;

		// Return SVGs as-is
		// TODO: Sharp has some support for SVGs, we could probably support this once Sharp is the default and only service.
		if (transform.format === 'svg') return { data: inputBuffer, format: 'svg' };

		const result = sharp(inputBuffer, {
			failOnError: false,
			pages: -1,
			limitInputPixels: config.service.config.limitInputPixels,
		});

		// always call rotate to adjust for EXIF data orientation
		result.rotate();

		// get some information about the input
		const { format } = await result.metadata();

		// If `fit` isn't set then use old behavior:
		// - Do not use both width and height for resizing, and prioritize width over height
		// - Allow enlarging images

		const withoutEnlargement = Boolean(transform.fit);
		if (transform.width && transform.height && transform.fit) {
			const fit: keyof FitEnum = fitMap[transform.fit] ?? 'inside';
			result.resize({
				width: Math.round(transform.width),
				height: Math.round(transform.height),
				kernel: kernel,
				fit,
				position: transform.position,
				withoutEnlargement,
			});
		} else if (transform.height && !transform.width) {
			result.resize({
				height: Math.round(transform.height),
				kernel: kernel,
				withoutEnlargement,
			});
		} else if (transform.width) {
			result.resize({
				width: Math.round(transform.width),
				kernel: kernel,
				withoutEnlargement,
			});
		}

		// If background is set, flatten the image with the specified background.
		// We do this after resize to ensure the background covers the entire image
		// even if its size has expanded.
		if (transform.background) {
			result.flatten({ background: transform.background });
		}

		if (transform.format) {
			let quality: number | string | undefined = undefined;
			if (transform.quality) {
				const parsedQuality = parseQuality(transform.quality);
				if (typeof parsedQuality === 'number') {
					quality = parsedQuality;
				} else {
					quality = transform.quality in qualityTable ? qualityTable[transform.quality] : undefined;
				}
			}

			if (transform.format === 'webp' && format === 'gif') {
				// Convert animated GIF to animated WebP with loop=0 (infinite)
				result.webp({ quality: typeof quality === 'number' ? quality : undefined, loop: 0 });
			} else {
				result.toFormat(transform.format as keyof FormatEnum, { quality });
			}
		}

		const { data, info } = await result.toBuffer({ resolveWithObject: true });

		// Sharp can sometimes return a SharedArrayBuffer when using WebAssembly.
		// SharedArrayBuffers need to be copied into an ArrayBuffer in order to be manipulated.
		const needsCopy = 'buffer' in data && data.buffer instanceof SharedArrayBuffer;

		return {
			data: needsCopy ? new Uint8Array(data) : data,
			format: info.format as ImageOutputFormat,
		};
	},
};

export default sharpService;
