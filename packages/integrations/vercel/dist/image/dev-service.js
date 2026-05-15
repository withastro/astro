import sharpService from 'astro/assets/services/sharp';
import { baseDevService } from './shared-dev-service.js';
const service = {
	...baseDevService,
	getHTMLAttributes(options, serviceOptions) {
		const { inputtedWidth, ...props } = options;
		if (inputtedWidth) {
			props.width = inputtedWidth;
		}
		return sharpService.getHTMLAttributes
			? sharpService.getHTMLAttributes(props, serviceOptions)
			: {};
	},
	transform(inputBuffer, transform, serviceOptions) {
		transform.format = transform.src.endsWith('svg') ? 'svg' : 'webp';
		return sharpService.transform(inputBuffer, transform, serviceOptions);
	},
};
var dev_service_default = service;
export { dev_service_default as default };
