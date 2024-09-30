import type { FormatEnum, SharpOptions } from 'sharp';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ImageOutputFormat, ImageQualityPreset } from '../types.js';
import {
	type BaseServiceTransform,
	type LocalImageService,
	baseService,
	parseQuality,
} from './service.js';

export interface SharpImageServiceConfig {
	/**
	 * The `limitInputPixels` option passed to Sharp. See https://sharp.pixelplumbing.com/api-constructor for more information
	 */
	limitInputPixels?: SharpOptions['limitInputPixels'];
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

const sharpService: LocalImageService<SharpImageServiceConfig> = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	getSrcSet: baseService.getSrcSet,
	async transform(inputBuffer, transformOptions, config) {
		if (!sharp) sharp = await loadSharp();

		const transform: BaseServiceTransform = transformOptions as BaseServiceTransform;

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

		// Never resize using both width and height at the same time, prioritizing width.
		if (transform.height && !transform.width) {
			result.resize({ height: Math.round(transform.height) });
		} else if (transform.width) {
			result.resize({ width: Math.round(transform.width) });
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

			result.toFormat(transform.format as keyof FormatEnum, { quality: quality });
		}

		const { data, info } = await result.toBuffer({ resolveWithObject: true });

		return {
			data: data,
			format: info.format as ImageOutputFormat,
		};
	},
};

export default sharpService;
