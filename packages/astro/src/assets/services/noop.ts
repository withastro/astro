import { baseService, type LocalImageService } from './service.js';

// Empty service used for platforms that don't support Sharp / users who don't want transformations.
const noopService: LocalImageService = {
	...baseService,
	propertiesToHash: ['src'],
	async validateOptions(options, imageConfig) {
		const newOptions = await (baseService.validateOptions?.(options, imageConfig) ?? options);
		delete newOptions.format;

		return newOptions;
	},
	async transform(inputBuffer, transformOptions) {
		return {
			data: inputBuffer,
			format: transformOptions.format,
		};
	},
};

export default noopService;
