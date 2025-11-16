import { isESMImportedImage } from '../utils/imageKind.js';
import { baseService, type LocalImageService } from './service.js';

// Empty service used for platforms that don't support Sharp / users who don't want transformations.
const noopService: LocalImageService = {
	...baseService,
	propertiesToHash: ['src'],
	validateOptions(options, imageConfig) {
		if (isESMImportedImage(options.src)) {
			return {
				src: options.src,
				format: options.src.format,
			};
		}
		return baseService.validateOptions?.(options, imageConfig) ?? options;
	},
	async transform(inputBuffer, transformOptions) {
		return {
			data: inputBuffer,
			format: transformOptions.format,
		};
	},
};

export default noopService;
