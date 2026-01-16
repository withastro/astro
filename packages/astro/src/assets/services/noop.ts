import { isESMImportedImage } from '../utils/imageKind.js';
import { baseService, type LocalImageService, verifyOptions } from './service.js';

// Empty service used for platforms that don't support Sharp / users who don't want transformations.
const noopService: LocalImageService = {
	...baseService,
	propertiesToHash: ['src'],
	async validateOptions(options) {
		if (isESMImportedImage(options.src) && options.src.format === 'svg') {
			options.format = 'svg';
		} else {
			delete options.format;
		}

		verifyOptions(options);

		return options;
	},
	async transform(inputBuffer, transformOptions) {
		return {
			data: inputBuffer,
			format: transformOptions.format,
		};
	},
};

export default noopService;
