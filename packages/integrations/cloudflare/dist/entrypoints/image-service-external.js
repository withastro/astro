import { joinPaths } from '@astrojs/internal-helpers/path';
import { baseService } from 'astro/assets';
import { isESMImportedImage } from 'astro/assets/utils';
import { isRemoteAllowed } from '../utils/assets.js';
const service = {
	...baseService,
	getURL: (options, imageConfig) => {
		const resizingParams = ['onerror=redirect'];
		if (options.width) resizingParams.push(`width=${options.width}`);
		if (options.height) resizingParams.push(`height=${options.height}`);
		if (options.quality) resizingParams.push(`quality=${options.quality}`);
		if (options.fit) resizingParams.push(`fit=${options.fit}`);
		if (options.format) resizingParams.push(`format=${options.format}`);
		let imageSource = '';
		if (isESMImportedImage(options.src)) {
			imageSource = options.src.src;
		} else if (isRemoteAllowed(options.src, imageConfig)) {
			imageSource = options.src;
		} else {
			return options.src;
		}
		const imageEndpoint = joinPaths(
			import.meta.env.BASE_URL,
			'/cdn-cgi/image',
			resizingParams.join(','),
			imageSource,
		);
		return imageEndpoint;
	},
};
var image_service_external_default = service;
export { image_service_external_default as default };
