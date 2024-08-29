import type { LocalImageService } from 'astro';
import { baseService } from 'astro/assets';
import { sharedValidateOptions } from './shared.js';

export const baseDevService: Omit<LocalImageService, 'transform'> = {
	...baseService,
	validateOptions: (options, serviceOptions) =>
		sharedValidateOptions(options, serviceOptions.service.config, 'development'),
	getURL(options) {
		const fileSrc = typeof options.src === 'string' ? options.src : options.src.src;

		const searchParams = new URLSearchParams();
		searchParams.append('href', fileSrc);

		options.width && searchParams.append('w', options.width.toString());
		options.quality && searchParams.append('q', options.quality.toString());

		// biome-ignore lint/style/useTemplate: <explanation>
		return '/_image?' + searchParams;
	},
	parseURL(url) {
		const params = url.searchParams;

		if (!params.has('href')) {
			return undefined;
		}

		const transform = {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			src: params.get('href')!,
			// biome-ignore lint/style/useNumberNamespace: <explanation>
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			width: params.has('w') ? parseInt(params.get('w')!) : undefined,
			quality: params.get('q'),
		};

		return transform;
	},
};
