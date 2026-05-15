import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { detector } from '../utils/vendor/image-size/detector.js';
import { baseService, parseQuality } from './service.js';
let sharp;
const qualityTable = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};
function resolveSharpQuality(quality) {
	if (!quality) return void 0;
	const parsedQuality = parseQuality(quality);
	if (typeof parsedQuality === 'number') {
		return parsedQuality;
	}
	return quality in qualityTable ? qualityTable[quality] : void 0;
}
function resolveSharpEncoderOptions(transform, inputFormat, serviceConfig = {}) {
	const quality = resolveSharpQuality(transform.quality);
	switch (transform.format) {
		case 'jpg':
		case 'jpeg':
			return {
				...serviceConfig.jpeg,
				...(quality === void 0 ? {} : { quality }),
			};
		case 'png':
			return {
				...serviceConfig.png,
				...(quality === void 0 ? {} : { quality }),
			};
		case 'webp': {
			const webpOptions = {
				...serviceConfig.webp,
				...(quality === void 0 ? {} : { quality }),
			};
			if (inputFormat === 'gif') {
				webpOptions.loop ??= 0;
			}
			return webpOptions;
		}
		case 'avif':
			return {
				...serviceConfig.avif,
				...(quality === void 0 ? {} : { quality }),
			};
		default:
			return quality === void 0 ? void 0 : { quality };
	}
}
async function loadSharp() {
	let sharpImport;
	try {
		sharpImport = (await import('sharp')).default;
	} catch {
		throw new AstroError(AstroErrorData.MissingSharp);
	}
	sharpImport.cache(false);
	return sharpImport;
}
const fitMap = {
	fill: 'fill',
	contain: 'inside',
	cover: 'cover',
	none: 'outside',
	'scale-down': 'inside',
	outside: 'outside',
	inside: 'inside',
};
const sharpService = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	getSrcSet: baseService.getSrcSet,
	getRemoteSize: baseService.getRemoteSize,
	async transform(inputBuffer, transformOptions, config) {
		if (!sharp) sharp = await loadSharp();
		const transform = transformOptions;
		const kernel = config.service.config.kernel;
		if (transform.format === 'svg') return { data: inputBuffer, format: 'svg' };
		if (detector(inputBuffer) === 'svg' && !config.dangerouslyProcessSVG) {
			throw new AstroError({
				...AstroErrorData.UnsupportedImageFormat,
				message:
					'SVG image processing is disabled. Set `image.dangerouslyProcessSVG: true` to allow processing of SVG sources.',
			});
		}
		const result = sharp(inputBuffer, {
			failOnError: false,
			pages: -1,
			limitInputPixels: config.service.config.limitInputPixels,
		});
		result.rotate();
		let format;
		try {
			({ format } = await result.metadata());
		} catch {
			console.warn(
				`\u26A0\uFE0F  Astro could not optimize image "${transform.src}". Sharp doesn't support this format. The image will be used unoptimized. Consider converting to WebP or placing in the public/ folder.`,
			);
			return { data: inputBuffer, format: transform.format };
		}
		if (transform.width && transform.height) {
			const fit = transform.fit ? (fitMap[transform.fit] ?? 'inside') : void 0;
			result.resize({
				width: Math.round(transform.width),
				height: Math.round(transform.height),
				kernel,
				fit,
				position: transform.position,
				withoutEnlargement: true,
			});
		} else if (transform.height && !transform.width) {
			result.resize({
				height: Math.round(transform.height),
				withoutEnlargement: true,
				kernel,
			});
		} else if (transform.width) {
			result.resize({
				width: Math.round(transform.width),
				withoutEnlargement: true,
				kernel,
			});
		}
		if (transform.background) {
			result.flatten({ background: transform.background });
		}
		if (transform.format) {
			const encoderOptions = resolveSharpEncoderOptions(transform, format, config.service.config);
			if (transform.format === 'webp' && format === 'gif') {
				result.webp(encoderOptions);
			} else if (transform.format === 'webp') {
				result.webp(encoderOptions);
			} else if (transform.format === 'png') {
				result.png(encoderOptions);
			} else if (transform.format === 'avif') {
				result.avif(encoderOptions);
			} else if (transform.format === 'jpeg' || transform.format === 'jpg') {
				result.jpeg(encoderOptions);
			} else {
				result.toFormat(transform.format, encoderOptions);
			}
		}
		const { data, info } = await result.toBuffer({ resolveWithObject: true });
		const needsCopy = 'buffer' in data && data.buffer instanceof SharedArrayBuffer;
		return {
			data: needsCopy ? new Uint8Array(data) : data,
			format: info.format,
		};
	},
};
var sharp_default = sharpService;
export { sharp_default as default, resolveSharpEncoderOptions };
