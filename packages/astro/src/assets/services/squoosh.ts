import { yellow } from 'kleur/colors';
import type { ImageOutputFormat, ImageQualityPreset } from '../types.js';
import { imageMetadata } from '../utils/metadata.js';
import {
	type BaseServiceTransform,
	type LocalImageService,
	baseService,
	parseQuality,
} from './service.js';
import { processBuffer } from './vendor/squoosh/image-pool.js';
import type { Operation } from './vendor/squoosh/image.js';

console.warn(
	yellow(
		'The Squoosh image service is deprecated and will be removed in Astro 5.x. We suggest migrating to the default Sharp image service instead, as it is faster, more powerful and better maintained.',
	),
);

const baseQuality = { low: 25, mid: 50, high: 80, max: 100 };
const qualityTable: Record<
	Exclude<ImageOutputFormat, 'png' | 'svg'>,
	Record<ImageQualityPreset, number>
> = {
	avif: {
		// Squoosh's AVIF encoder has a bit of a weird behavior where `62` is technically the maximum, and anything over is overkill
		max: 62,
		high: 45,
		mid: 35,
		low: 20,
	},
	jpeg: baseQuality,
	jpg: baseQuality,
	webp: baseQuality,
	// Squoosh's PNG encoder does not support a quality setting, so we can skip that here
};

async function getRotationForEXIF(
	inputBuffer: Uint8Array,
	src?: string,
): Promise<Operation | undefined> {
	const meta = await imageMetadata(inputBuffer, src);
	if (!meta) return undefined;

	// EXIF orientations are a bit hard to read, but the numbers are actually standard. See https://exiftool.org/TagNames/EXIF.html for a list.
	// Various illustrations can also be found online for a more graphic representation, it's a bit old school.
	switch (meta.orientation) {
		case 3:
		case 4:
			return { type: 'rotate', numRotations: 2 };
		case 5:
		case 6:
			return { type: 'rotate', numRotations: 1 };
		case 7:
		case 8:
			return { type: 'rotate', numRotations: 3 };
		case undefined:
		default:
			return undefined;
	}
}

const service: LocalImageService = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	getSrcSet: baseService.getSrcSet,
	async transform(inputBuffer, transformOptions) {
		const transform: BaseServiceTransform = transformOptions as BaseServiceTransform;

		let format = transform.format;

		// Return SVGs as-is
		if (format === 'svg') return { data: inputBuffer, format: 'svg' };

		const operations: Operation[] = [];

		const rotation = await getRotationForEXIF(inputBuffer, transform.src);

		if (rotation) {
			operations.push(rotation);
		}

		// Never resize using both width and height at the same time, prioritizing width.
		if (transform.height && !transform.width) {
			operations.push({
				type: 'resize',
				height: Math.round(transform.height),
			});
		} else if (transform.width) {
			operations.push({
				type: 'resize',
				width: Math.round(transform.width),
			});
		}

		let quality: number | string | undefined = undefined;
		if (transform.quality) {
			const parsedQuality = parseQuality(transform.quality);
			if (typeof parsedQuality === 'number') {
				quality = parsedQuality;
			} else {
				quality =
					transform.quality in qualityTable[format]
						? qualityTable[format][transform.quality]
						: undefined;
			}
		}

		const data = await processBuffer(inputBuffer, operations, format, quality);

		return {
			data: Buffer.from(data),
			format: format,
		};
	},
};

export default service;
