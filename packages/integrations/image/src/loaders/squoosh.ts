// @ts-ignore
import { ImagePool } from '@squoosh/lib';
import { red } from 'kleur/colors';
import { BaseSSRService } from './index.js';
import { isAspectRatioString, isOutputFormat } from '../utils/images.js';
import { error } from '../utils/logger.js';
import { metadata } from '../utils/metadata.js';
import type { OutputFormat, SSRImageService, TransformOptions } from './index.js';

class SquooshService extends BaseSSRService {
	/**
	 * Squoosh doesn't support multithreading when transforming to AVIF files.
	 * 
	 * https://github.com/GoogleChromeLabs/squoosh/issues/1111
	 */
	#imagePool = new ImagePool(1);

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

	async processPng(image: any, transform: TransformOptions) {
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
			format: 'png' as OutputFormat,
		};
	}

	async autorotate(image: any, transform: TransformOptions, inputBuffer: Buffer) {
		// check EXIF orientation data and rotate the image if needed
		const meta = await metadata(transform.src, inputBuffer);

		switch (meta?.orientation) {
			case 3:
			case 4:
				await image.preprocess({ rotate: { numRotations: 2 } });
				break;
			case 5:
			case 6:
				await image.preprocess({ rotate: { numRotations: 1 } });
				break;
			case 7:
			case 8:
				await image.preprocess({ rotate: { numRotations: 3 } });
				break;
		}
	}

	async transform(inputBuffer: Buffer, transform: TransformOptions) {
		const image = this.#imagePool.ingestImage(inputBuffer);

		let preprocessOptions: any = {};

		// Image files lie! Rotate the image based on EXIF data
		await this.autorotate(image, transform, inputBuffer);

		if (transform.width || transform.height) {
			const width = transform.width && Math.round(transform.width);
			const height = transform.height && Math.round(transform.height);

			preprocessOptions.resize = {
				width,
				height,
			};

			await image.preprocess({ resize: { width, height } });
		}

		switch (transform.format) {
			case 'avif':
				return await this.processAvif(image, transform);
			case 'jpg':
			case 'jpeg':
				return await this.processJpeg(image, transform);
			case 'png':
				return await this.processPng(image, transform);
			case 'webp':
				return await this.processWebp(image, transform);
			default:
				error({
					level: 'info',
					prefix: false,
					message: red(`Unknown image output: "${transform.format}" used for ${transform.src}`),
				});
				throw new Error(`Unknown image output: "${transform.format}" used for ${transform.src}`);
		}
	}
}

const service = new SquooshService();

export default service;
