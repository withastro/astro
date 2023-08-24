import { baseService, type LocalImageService } from './service.js';

// Empty service used for platforms that neither support Squoosh or Sharp.
const noopService: LocalImageService = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	async transform(inputBuffer, transformOptions) {
		return {
			data: inputBuffer,
			format: transformOptions.format,
		};
	},
};

export default noopService;
