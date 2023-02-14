import { ImageTransform, OutputFormat } from '../types.js';
import { baseService, LocalImageService } from './service.js';

let sharp: typeof import('sharp');
try {
	sharp = (await import('sharp')).default;
} catch (e) {
	throw new Error('Could not find Sharp. Please install Sharp manually into your project');
}

const sharpService: LocalImageService = {
	getURL: baseService.getURL,
	parseParams(params) {
		if (!params.has('href')) {
			return undefined;
		}

		let transform: Partial<ImageTransform> = { src: params.get('href')! };

		if (params.has('w')) {
			transform.width = parseInt(params.get('w')!);
		}

		if (params.has('h')) {
			transform.height = parseInt(params.get('h')!);
		}

		return transform;
	},
	async transform(inputBuffer, transform) {
		// If the user didn't specify a format, we'll default to `webp`. It offers the best ratio of compatibility / quality
		// In the future, hopefully we can replace this with `avif`, alas, Edge. See https://caniuse.com/avif
		if (!transform.format) {
			transform.format = 'webp';
		}

		let result = sharp(inputBuffer, { failOnError: false, pages: -1 });

		if (transform.width) {
			result.resize({ width: transform.width as any });
		}

		const { data, info } = await result.toBuffer({ resolveWithObject: true });

		return {
			data: data,
			format: info.format as OutputFormat,
		};
	},
};

export default sharpService;
