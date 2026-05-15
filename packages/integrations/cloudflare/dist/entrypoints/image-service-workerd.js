import { baseService } from 'astro/assets';
const service = {
	...baseService,
	async transform(inputBuffer, transform) {
		return { data: inputBuffer, format: transform.format };
	},
};
var image_service_workerd_default = service;
export { image_service_workerd_default as default };
