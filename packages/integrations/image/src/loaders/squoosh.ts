import { red } from 'kleur/colors';
import { error } from '../utils/logger.js';
import { metadata } from '../utils/metadata.js';
import { isRemoteImage } from '../utils/paths.js';
import type { Operation } from '../vendor/squoosh/image.js';
import type { OutputFormat, TransformOptions } from './index.js';
import { BaseSSRService } from './index.js';

const imagePoolModulePromise = import('../vendor/squoosh/image-pool.js');

class SquooshService extends BaseSSRService {
	async processAvif(image: any, transform: TransformOptions) {
		const encodeOptions = transform.quality
			? { avif: { quality: transform.quality } }
			: { avif: {} };
		await image.encode(encodeOptions);
		const data = await image.encodedWith.avif;

		return {
			data: data.binary,
			format: 'avif' as OutputFormat,
		};
	}

	async processJpeg(image: any, transform: TransformOptions) {
		const encodeOptions = transform.quality
			? { mozjpeg: { quality: transform.quality } }
			: { mozjpeg: {} };
		await image.encode(encodeOptions);
		const data = await image.encodedWith.mozjpeg;

		return {
			data: data.binary,
			format: 'jpeg' as OutputFormat,
		};
	}

	async processPng(image: any) {
		await image.encode({ oxipng: {} });
		const data = await image.encodedWith.oxipng;

		return {
			data: data.binary,
			format: 'png' as OutputFormat,
		};
	}

	async processWebp(image: any, transform: TransformOptions) {
		const encodeOptions = transform.quality
			? { webp: { quality: transform.quality } }
			: { webp: {} };
		await image.encode(encodeOptions);
		const data = await image.encodedWith.webp;

		return {
			data: data.binary,
			format: 'webp' as OutputFormat,
		};
	}

	async autorotate(
		transform: TransformOptions,
		inputBuffer: Buffer
	): Promise<Operation | undefined> {
		// check EXIF orientation data and rotate the image if needed
		try {
			const meta = await metadata(transform.src, inputBuffer);

			switch (meta?.orientation) {
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
		} catch {
			error({
				level: 'info',
				prefix: false,
				message: red(`Cannot read metadata for ${transform.src}`),
			});
		}
	}

	async transform(inputBuffer: Buffer, transform: TransformOptions) {
		if (transform.format === 'svg') {
			// squoosh can't output SVG so we return the input image
			return {
				data: inputBuffer,
				format: transform.format,
			};
		}

		const operations: Operation[] = [];

		if (!isRemoteImage(transform.src)) {
			const autorotate = await this.autorotate(transform, inputBuffer);

			if (autorotate) {
				operations.push(autorotate);
			}
		} else if (transform.src.startsWith('//')) {
			transform.src = `https:${transform.src}`;
		}

		if (transform.width || transform.height) {
			const width = transform.width && Math.round(transform.width);
			const height = transform.height && Math.round(transform.height);

			operations.push({
				type: 'resize',
				width,
				height,
			});
		}

		if (!transform.format) {
			error({
				level: 'info',
				prefix: false,
				message: red(`Unknown image output: "${transform.format}" used for ${transform.src}`),
			});
			throw new Error(`Unknown image output: "${transform.format}" used for ${transform.src}`);
		}
		const { processBuffer } = await imagePoolModulePromise;
		const data = await processBuffer(inputBuffer, operations, transform.format, transform.quality);

		return {
			data: Buffer.from(data),
			format: transform.format,
		};
	}
}

const service = new SquooshService();

export default service;
