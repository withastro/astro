import { baseService, LocalImageService } from './service.js';
import { processBuffer } from './vendor/squoosh/image-pool.js';
import type { Operation } from './vendor/squoosh/image.js';

const service: LocalImageService = {
	validateTransform: baseService.validateTransform,
	getURL: baseService.getURL,
	parseParams: baseService.parseParams,
	getHTMLAttributes: baseService.getHTMLAttributes,
	async transform(inputBuffer, transform) {
		let format = transform.format;
		if (!format) {
			format = 'webp';
		}

		const operations: Operation[] = [];

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

		const data = await processBuffer(inputBuffer, operations, format, transform.quality as any);

		return {
			data: Buffer.from(data),
			format: format,
		};
	},
};

export default service;
