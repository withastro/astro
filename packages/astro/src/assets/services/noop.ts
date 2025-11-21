import { baseService, type LocalImageService } from './service.js';

// Empty service used for platforms that don't support Sharp / users who don't want transformations.
const noopService: LocalImageService = {
	...baseService,
	propertiesToHash: ['src'],
	async validateOptions(options, imageConfig) {
		if (baseService.validateOptions) {
			options["isNoop"] = true;
			const validatedOptions = await baseService.validateOptions(options, imageConfig);
			delete validatedOptions["isNoop"];
			return validatedOptions;
		}
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
