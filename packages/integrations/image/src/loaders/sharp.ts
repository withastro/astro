import sharp from 'sharp';
import { isAspectRatioString, isOutputFormat } from '../utils/images.js';
import { BaseSSRService } from './index.js';
import type { OutputFormat, SSRImageService, TransformOptions } from './index.js';

class SharpService extends BaseSSRService {
	async transform(inputBuffer: Buffer, transform: TransformOptions) {
		const sharpImage = sharp(inputBuffer, { failOnError: false, pages: -1 });

		// always call rotate to adjust for EXIF data orientation
		sharpImage.rotate();

		if (transform.width || transform.height) {
			const width = transform.width && Math.round(transform.width);
			const height = transform.height && Math.round(transform.height);
			sharpImage.resize(width, height);
		}

		if (transform.format) {
			sharpImage.toFormat(transform.format, { quality: transform.quality });
		}

		const { data, info } = await sharpImage.toBuffer({ resolveWithObject: true });

		return {
			data,
			format: info.format as OutputFormat,
		};
	}
}

const service = new SharpService();

export default service;
