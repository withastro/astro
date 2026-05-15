import { isESMImportedImage } from 'astro/assets/utils';
function getDefaultImageConfig(astroImageConfig) {
	return {
		sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		domains: astroImageConfig.domains ?? [],
		// Cast is necessary here because Vercel's types are slightly different from ours regarding allowed protocols. Behavior should be the same, however.
		remotePatterns: astroImageConfig.remotePatterns ?? [],
	};
}
const qualityTable = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};
function getAstroImageConfig(images, imagesConfig, command, devImageService, astroImageConfig) {
	let devService = '@astrojs/vercel/dev-image-service';
	switch (devImageService) {
		case 'sharp':
			devService = '@astrojs/vercel/dev-image-service';
			break;
		default:
			if (typeof devImageService === 'string') {
				devService = devImageService;
			} else {
				devService = '@astrojs/vercel/dev-image-service';
			}
			break;
	}
	if (images) {
		const config = imagesConfig ? imagesConfig : getDefaultImageConfig(astroImageConfig);
		return {
			image: {
				service: {
					entrypoint: command === 'dev' ? devService : '@astrojs/vercel/build-image-service',
					config,
				},
				breakpoints: config.sizes,
			},
		};
	}
	return {};
}
function sharedValidateOptions(options, serviceConfig, mode) {
	const vercelImageOptions = serviceConfig;
	if (
		mode === 'development' &&
		(!vercelImageOptions.sizes || vercelImageOptions.sizes.length === 0)
	) {
		throw new Error('Vercel Image Optimization requires at least one size to be configured.');
	}
	const configuredWidths = vercelImageOptions.sizes.sort((a, b) => a - b);
	if (!options.width) {
		const src = options.src;
		if (isESMImportedImage(src)) {
			const nearestWidth = configuredWidths.reduce((prev, curr) => {
				return Math.abs(curr - src.width) < Math.abs(prev - src.width) ? curr : prev;
			});
			options.inputtedWidth = src.width;
			options.width = nearestWidth;
		} else {
			throw new Error(`Missing \`width\` parameter for remote image ${options.src}`);
		}
	} else {
		if (!configuredWidths.includes(options.width)) {
			const nearestWidth = configuredWidths.reduce((prev, curr) => {
				return Math.abs(curr - options.width) < Math.abs(prev - options.width) ? curr : prev;
			});
			options.inputtedWidth = options.width;
			options.width = nearestWidth;
		}
	}
	if (options.widths) {
		options.widths = options.widths.filter((w) => configuredWidths.includes(w));
		if (options.widths.length === 0) {
			options.widths = [options.width];
		}
	}
	if (options.quality && typeof options.quality === 'string') {
		options.quality = options.quality in qualityTable ? qualityTable[options.quality] : void 0;
	}
	if (!options.quality) {
		options.quality = 100;
	}
	return options;
}
export { getAstroImageConfig, getDefaultImageConfig, sharedValidateOptions };
