import sharp from 'sharp';
import type { SSRImageService } from '../loaders/index.js';
import { BaseSSRService, isOutputFormatSupportsAlpha } from '../loaders/index.js';
import type { OutputFormat, TransformOptions } from './index.js';

class SharpService extends BaseSSRService {
	async transform(inputBuffer: Buffer, transform: TransformOptions) {
		if (transform.format === 'svg') {
			// sharp can't output SVG so we return the input image
			return {
				data: inputBuffer,
				format: transform.format,
			};
		}

		const sharpImage = sharp(inputBuffer, { failOnError: false, pages: -1 });

		// always call rotate to adjust for EXIF data orientation
		sharpImage.rotate();

		if (transform.width || transform.height) {
			const width = transform.width && Math.round(transform.width);
			const height = transform.height && Math.round(transform.height);

			sharpImage.resize({
				width,
				height,
				fit: transform.fit,
				position: transform.position,
				background: transform.background,
			});
		}

		if (transform.format) {
			sharpImage.toFormat(transform.format, { quality: transform.quality });

			if (transform.background && !isOutputFormatSupportsAlpha(transform.format)) {
				sharpImage.flatten({ background: transform.background });
			}
		}

		const { data, info } = await sharpImage.toBuffer({ resolveWithObject: true });

		return {
			data,
			format: info.format as OutputFormat,
		};
	}
}

const service: SSRImageService = new SharpService();

export default service;
