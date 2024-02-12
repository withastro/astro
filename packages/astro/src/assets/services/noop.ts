import { type LocalImageService, baseService } from './service.js';

// Empty service used for platforms that neither support Squoosh or Sharp.
const noopService: LocalImageService = {
	...baseService,
	propertiesToHash: ['src'],
	async transform(inputBuffer, transformOptions) {
		return {
			data: inputBuffer,
			format: transformOptions.format,
		};
	},
};

export default noopService;
