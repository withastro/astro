import { OutputFormat } from '../types.js';
import { baseService, LocalImageService } from './service.js';

let sharp: typeof import('sharp');
try {
	sharp = (await import('sharp')).default;
} catch (e) {
	throw new Error('Could not find Sharp. Please install Sharp manually into your project');
}

const sharpService: LocalImageService = {
	validateTransform: baseService.validateTransform,
	getURL: baseService.getURL,
	parseParams: baseService.parseParams,
	getHTMLAttributes: baseService.getHTMLAttributes,
	async transform(inputBuffer, transform) {
		// If the user didn't specify a format, we'll default to `webp`. It offers the best ratio of compatibility / quality
		// In the future, hopefully we can replace this with `avif`, alas, Edge. See https://caniuse.com/avif
		if (!transform.format) {
			transform.format = 'webp';
		}

		let result = sharp(inputBuffer, { failOnError: false, pages: -1 });

		// Never resize using both width and height at the same time, prioritizing width.
		if (transform.height && !transform.width) {
			result.resize({ height: transform.height });
		} else if (transform.width) {
			result.resize({ width: transform.width });
		}

		const { data, info } = await result.toBuffer({ resolveWithObject: true });

		return {
			data: data,
			format: info.format as OutputFormat,
		};
	},
};

export default sharpService;
