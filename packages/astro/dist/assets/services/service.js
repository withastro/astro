import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { isRemotePath, joinPaths } from '../../core/path.js';
import { DEFAULT_HASH_PROPS, DEFAULT_OUTPUT_FORMAT, VALID_SUPPORTED_FORMATS } from '../consts.js';
import { isESMImportedImage, isRemoteImage } from '../utils/imageKind.js';
import { inferRemoteSize } from '../utils/remoteProbe.js';
function isLocalService(service) {
	if (!service) {
		return false;
	}
	return 'transform' in service;
}
function parseQuality(quality) {
	let result = Number.parseInt(quality);
	if (Number.isNaN(result)) {
		return quality;
	}
	return result;
}
const sortNumeric = (a, b) => a - b;
function verifyOptions(options) {
	if (!options.src || (!isRemoteImage(options.src) && !isESMImportedImage(options.src))) {
		throw new AstroError({
			...AstroErrorData.ExpectedImage,
			message: AstroErrorData.ExpectedImage.message(
				JSON.stringify(options.src),
				typeof options.src,
				JSON.stringify(options, (_, v) => (v === void 0 ? null : v)),
			),
		});
	}
	if (!isESMImportedImage(options.src)) {
		if (
			options.src.startsWith('/@fs/') ||
			(!isRemotePath(options.src) && !options.src.startsWith('/'))
		) {
			throw new AstroError({
				...AstroErrorData.LocalImageUsedWrongly,
				message: AstroErrorData.LocalImageUsedWrongly.message(options.src),
			});
		}
		let missingDimension;
		if (!options.width && !options.height) {
			missingDimension = 'both';
		} else if (!options.width && options.height) {
			missingDimension = 'width';
		} else if (options.width && !options.height) {
			missingDimension = 'height';
		}
		if (missingDimension) {
			throw new AstroError({
				...AstroErrorData.MissingImageDimension,
				message: AstroErrorData.MissingImageDimension.message(missingDimension, options.src),
			});
		}
	} else {
		if (!VALID_SUPPORTED_FORMATS.includes(options.src.format)) {
			throw new AstroError({
				...AstroErrorData.UnsupportedImageFormat,
				message: AstroErrorData.UnsupportedImageFormat.message(
					options.src.format,
					options.src.src,
					VALID_SUPPORTED_FORMATS,
				),
			});
		}
		if (options.widths && options.densities) {
			throw new AstroError(AstroErrorData.IncompatibleDescriptorOptions);
		}
		if (options.src.format !== 'svg' && options.format === 'svg') {
			throw new AstroError(AstroErrorData.UnsupportedImageConversion);
		}
	}
}
const baseService = {
	propertiesToHash: DEFAULT_HASH_PROPS,
	validateOptions(options) {
		verifyOptions(options);
		if (!options.format) {
			if (isESMImportedImage(options.src) && options.src.format === 'svg') {
				options.format = 'svg';
			} else {
				options.format = DEFAULT_OUTPUT_FORMAT;
			}
		}
		if (options.width) options.width = Math.round(options.width);
		if (options.height) options.height = Math.round(options.height);
		if (options.layout) {
			delete options.layout;
		}
		if (options.fit === 'none') {
			delete options.fit;
		}
		return options;
	},
	getHTMLAttributes(options) {
		const { targetWidth, targetHeight } = getTargetDimensions(options);
		const {
			src,
			width,
			height,
			format,
			quality,
			densities,
			widths,
			formats,
			layout,
			priority,
			fit,
			position,
			background,
			...attributes
		} = options;
		return {
			...attributes,
			width: targetWidth,
			height: targetHeight,
			loading: attributes.loading ?? 'lazy',
			decoding: attributes.decoding ?? 'async',
		};
	},
	getSrcSet(options) {
		const { targetWidth, targetHeight } = getTargetDimensions(options);
		const aspectRatio = targetWidth / targetHeight;
		const { widths, densities } = options;
		const targetFormat = options.format ?? DEFAULT_OUTPUT_FORMAT;
		let transformedWidths = (widths ?? []).sort(sortNumeric);
		let imageWidth = options.width;
		let maxWidth = Number.POSITIVE_INFINITY;
		if (isESMImportedImage(options.src)) {
			imageWidth = options.src.width;
			maxWidth = imageWidth;
			if (transformedWidths.length > 0 && transformedWidths.at(-1) > maxWidth) {
				transformedWidths = transformedWidths.filter((width) => width <= maxWidth);
				transformedWidths.push(maxWidth);
			}
		}
		transformedWidths = Array.from(new Set(transformedWidths));
		const {
			width: transformWidth,
			height: transformHeight,
			...transformWithoutDimensions
		} = options;
		let allWidths = [];
		if (densities) {
			const densityValues = densities.map((density) => {
				if (typeof density === 'number') {
					return density;
				} else {
					return Number.parseFloat(density);
				}
			});
			const densityWidths = densityValues
				.sort(sortNumeric)
				.map((density) => Math.round(targetWidth * density));
			allWidths = densityWidths.map((width, index) => ({
				width,
				descriptor: `${densityValues[index]}x`,
			}));
		} else if (transformedWidths.length > 0) {
			allWidths = transformedWidths.map((width) => ({
				width,
				descriptor: `${width}w`,
			}));
		}
		return allWidths.map(({ width, descriptor }) => {
			const height = Math.round(width / aspectRatio);
			const transform = { ...transformWithoutDimensions, width, height };
			return {
				transform,
				descriptor,
				attributes: {
					type: `image/${targetFormat}`,
				},
			};
		});
	},
	getURL(options, imageConfig) {
		const searchParams = new URLSearchParams();
		if (isESMImportedImage(options.src)) {
			searchParams.append('href', options.src.src);
		} else if (isRemoteAllowed(options.src, imageConfig)) {
			searchParams.append('href', options.src);
		} else {
			return options.src;
		}
		const params = {
			w: 'width',
			h: 'height',
			q: 'quality',
			f: 'format',
			fit: 'fit',
			position: 'position',
			background: 'background',
		};
		Object.entries(params).forEach(([param, key]) => {
			options[key] && searchParams.append(param, options[key].toString());
		});
		const imageEndpoint = joinPaths(import.meta.env.BASE_URL, imageConfig.endpoint.route);
		let url = `${imageEndpoint}?${searchParams}`;
		if (imageConfig.assetQueryParams) {
			const assetQueryString = imageConfig.assetQueryParams.toString();
			if (assetQueryString) {
				url += '&' + assetQueryString;
			}
		}
		return url;
	},
	parseURL(url) {
		const params = url.searchParams;
		if (!params.has('href')) {
			return void 0;
		}
		const transform = {
			src: params.get('href'),
			width: params.has('w') ? Number.parseInt(params.get('w')) : void 0,
			height: params.has('h') ? Number.parseInt(params.get('h')) : void 0,
			format: params.get('f'),
			quality: params.get('q'),
			fit: params.get('fit'),
			position: params.get('position') ?? void 0,
			background: params.get('background') ?? void 0,
		};
		return transform;
	},
	getRemoteSize(url, imageConfig) {
		return inferRemoteSize(url, imageConfig);
	},
};
function getTargetDimensions(options) {
	let targetWidth = options.width;
	let targetHeight = options.height;
	if (isESMImportedImage(options.src)) {
		const aspectRatio = options.src.width / options.src.height;
		if (targetHeight && !targetWidth) {
			targetWidth = Math.round(targetHeight * aspectRatio);
		} else if (targetWidth && !targetHeight) {
			targetHeight = Math.round(targetWidth / aspectRatio);
		} else if (!targetWidth && !targetHeight) {
			targetWidth = options.src.width;
			targetHeight = options.src.height;
		}
	}
	return {
		targetWidth,
		targetHeight,
	};
}
export { baseService, isLocalService, parseQuality, verifyOptions };
