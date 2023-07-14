// TODO: Investigate removing this service once sharp lands WASM support, as libsquoosh is deprecated

import type { ImageOutputFormat, ImageQualityPreset } from '../types.js';
import { imageMetadata } from '../utils/metadata.js';
import {
	baseService,
	parseQuality,
	type BaseServiceTransform,
	type LocalImageService,
	type LocalImageTransform,
} from './service.js';
import { processBuffer } from './vendor/squoosh/image-pool.js';
import type { Operation } from './vendor/squoosh/image.js';

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
	transform: LocalImageTransform,
	inputBuffer: Buffer
): Promise<Operation | undefined> {
	// check EXIF orientation data and rotate the image if needed
	const meta = await imageMetadata(transform.src, inputBuffer);

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
	}
}

const service: LocalImageService = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	async transform(inputBuffer, transformOptions) {
		const transform: BaseServiceTransform = transformOptions as BaseServiceTransform;

		let format = transform.format;

		// Return SVGs as-is
		if (format === 'svg') return { data: inputBuffer, format: 'svg' };

		const operations: Operation[] = [];

		const rotation = await getRotationForEXIF(transform, inputBuffer);

		if (rotation) {
			operations.push(rotation);
		}

		// Never resize using both width and height at the same time, prioritizing width.
		if (transform.height && !transform.width) {
			operations.push({
				type: 'resize',
				height: transform.height,
			});
		} else if (transform.width) {
			operations.push({
				type: 'resize',
				width: transform.width,
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
