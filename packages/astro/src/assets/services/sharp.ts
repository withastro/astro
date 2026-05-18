import type {
	AvifOptions,
	FitEnum,
	FormatEnum,
	JpegOptions,
	PngOptions,
	ResizeOptions,
	SharpOptions,
	WebpOptions,
} from 'sharp';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ImageFit, ImageOutputFormat, ImageQualityPreset } from '../types.js';
import { detector } from '../utils/vendor/image-size/detector.js';
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

	/**
	 * The default encoder options passed to `sharp().jpeg()`.
	 */
	jpeg?: JpegOptions;

	/**
	 * The default encoder options passed to `sharp().png()`.
	 */
	png?: PngOptions;

	/**
	 * The default encoder options passed to `sharp().webp()`.
	 */
	webp?: WebpOptions;

	/**
	 * The default encoder options passed to `sharp().avif()`.
	 */
	avif?: AvifOptions;
}

let sharp: typeof import('sharp');

const qualityTable: Record<ImageQualityPreset, number> = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};

function resolveSharpQuality(quality: BaseServiceTransform['quality']): number | undefined {
	if (!quality) return undefined;

	const parsedQuality = parseQuality(quality);
	if (typeof parsedQuality === 'number') {
		return parsedQuality;
	}

	return quality in qualityTable ? qualityTable[quality] : undefined;
}

export function resolveSharpEncoderOptions(
	transform: Pick<BaseServiceTransform, 'format' | 'quality'>,
	inputFormat: string | undefined,
	serviceConfig: SharpImageServiceConfig = {},
): JpegOptions | PngOptions | WebpOptions | AvifOptions | { quality?: number } | undefined {
	const quality = resolveSharpQuality(transform.quality);

	switch (transform.format) {
		case 'jpg':
		case 'jpeg':
			return {
				...serviceConfig.jpeg,
				...(quality === undefined ? {} : { quality }),
			};
		case 'png':
			return {
				...serviceConfig.png,
				...(quality === undefined ? {} : { quality }),
			};
		case 'webp': {
			const webpOptions: WebpOptions = {
				...serviceConfig.webp,
				...(quality === undefined ? {} : { quality }),
			};
			if (inputFormat === 'gif') {
				webpOptions.loop ??= 0;
			}
			return webpOptions;
		}
		case 'avif':
			return {
				...serviceConfig.avif,
				...(quality === undefined ? {} : { quality }),
			};
		default:
			return quality === undefined ? undefined : { quality };
	}
}

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
	getRemoteSize: baseService.getRemoteSize,
	async transform(inputBuffer, transformOptions, config) {
		if (!sharp) sharp = await loadSharp();
		const transform: BaseServiceTransform = transformOptions as BaseServiceTransform;
		const kernel = config.service.config.kernel;

		// Return SVGs as-is
		// TODO: Sharp has some support for SVGs, we could probably support this once Sharp is the default and only service.
		if (transform.format === 'svg') return { data: inputBuffer, format: 'svg' };

		// Rasterizing an SVG runs librsvg on untrusted input; require explicit opt-in.
		if (detector(inputBuffer) === 'svg' && !config.dangerouslyProcessSVG) {
			throw new AstroError({
				...AstroErrorData.UnsupportedImageFormat,
				message:
					'SVG image processing is disabled. Set `image.dangerouslyProcessSVG: true` to allow processing of SVG sources.',
			});
		}

		const result = sharp(inputBuffer, {
			failOnError: false,
			pages: -1,
			limitInputPixels: config.service.config.limitInputPixels,
		});

		// always call rotate to adjust for EXIF data orientation
		result.rotate();
		// get some information about the input
		let format: string | undefined;
		try {
			({ format } = await result.metadata());
		} catch {
			// Sharp cannot decode this image (e.g. animated AVIF sequences).
			// Pass it through unmodified rather than crashing the build. When Sharp adds support for these
			// formats, the image will be optimized automatically without code changes.
			console.warn(
				`⚠️  Astro could not optimize image "${transform.src}". ` +
					`Sharp doesn't support this format. The image will be used unoptimized. ` +
					`Consider converting to WebP or placing in the public/ folder.`,
			);
			return { data: inputBuffer, format: transform.format };
		}

		if (transform.width && transform.height) {
			const fit: keyof FitEnum | undefined = transform.fit
				? (fitMap[transform.fit] ?? 'inside')
				: undefined;

			result.resize({
				width: Math.round(transform.width),
				height: Math.round(transform.height),
				kernel,
				fit,
				position: transform.position,
				withoutEnlargement: true,
			});
		} else if (transform.height && !transform.width) {
			result.resize({
				height: Math.round(transform.height),
				withoutEnlargement: true,
				kernel,
			});
		} else if (transform.width) {
			result.resize({
				width: Math.round(transform.width),
				withoutEnlargement: true,
				kernel,
			});
		}

		// If background is set, flatten the image with the specified background.
		// We do this after resize to ensure the background covers the entire image
		// even if its size has expanded.
		if (transform.background) {
			result.flatten({ background: transform.background });
		}

		if (transform.format) {
			const encoderOptions = resolveSharpEncoderOptions(transform, format, config.service.config);

			if (transform.format === 'webp' && format === 'gif') {
				// Convert animated GIF to animated WebP with loop=0 (infinite) unless overridden in config.
				result.webp(encoderOptions as WebpOptions | undefined);
			} else if (transform.format === 'webp') {
				result.webp(encoderOptions as WebpOptions | undefined);
			} else if (transform.format === 'png') {
				result.png(encoderOptions as PngOptions | undefined);
			} else if (transform.format === 'avif') {
				result.avif(encoderOptions as AvifOptions | undefined);
			} else if (transform.format === 'jpeg' || transform.format === 'jpg') {
				result.jpeg(encoderOptions as JpegOptions | undefined);
			} else {
				result.toFormat(transform.format as keyof FormatEnum, encoderOptions);
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
