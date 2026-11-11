import {
	type AvifConfig,
	FastResizeFilter,
	type PngEncodeOptions,
	ResizeFit,
	Transformer,
} from '@napi-rs/image';
import type { ImageOutputFormat, LocalImageService } from 'astro';
import { baseService } from 'astro/assets';
import { imageMetadata } from 'astro/assets/utils';
import { AstroError } from 'astro/errors';

export interface NapiImageServiceConfig {
	/** Images with more pixels than this are rejected. Defaults to 0x3FFF * 0x3FFF; `false` disables the limit. */
	limitInputPixels?: number | false;
	/** Default JPEG options. `quality` defaults to 80. */
	jpeg?: { quality?: number };
	/** Default PNG options passed to `Transformer.png()`. */
	png?: PngEncodeOptions;
	/** Default WebP options. `quality` defaults to 80. */
	webp?: { quality?: number };
	/** Default AVIF options passed to `Transformer.avif()`. `quality` defaults to 50. */
	avif?: AvifConfig;
}

type ImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down' | 'outside' | 'inside';

interface Transform {
	src: string;
	width?: number;
	height?: number;
	format?: string;
	quality?: string | number;
	fit?: ImageFit;
	position?: string;
	background?: string;
}

interface Size {
	width: number;
	height: number;
}

interface ResizePlan {
	resize?: Size;
	crop?: Size & { x: number; y: number };
}

const DEFAULT_LIMIT_INPUT_PIXELS = 0x3fff * 0x3fff;

const QUALITY_PRESETS: Record<string, number> = { low: 25, mid: 50, high: 80, max: 100 };

const FIT_MAP: Record<ImageFit, 'fill' | 'inside' | 'cover' | 'outside'> = {
	fill: 'fill',
	contain: 'inside',
	cover: 'cover',
	none: 'outside',
	'scale-down': 'inside',
	outside: 'outside',
	inside: 'inside',
};

function resolveQuality(quality: Transform['quality']): number | undefined {
	if (typeof quality === 'number') return quality;
	if (!quality) return undefined;
	const parsed = QUALITY_PRESETS[quality] ?? Number.parseInt(quality, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function positionRatios(position: string | undefined): [number, number] {
	const words = position?.toLowerCase().split(/\s+/) ?? [];
	const x = words.includes('left') ? 0 : words.includes('right') ? 1 : 0.5;
	const y = words.includes('top') ? 0 : words.includes('bottom') ? 1 : 0.5;
	return [x, y];
}

// Computed here because @napi-rs/image's resize upscales, and images must never be enlarged.
function planResize(source: Size, transform: Transform): ResizePlan {
	const scaled = (scale: number): Size => ({
		width: Math.max(1, Math.round(source.width * scale)),
		height: Math.max(1, Math.round(source.height * scale)),
	});
	const plan = (size: Size): ResizePlan =>
		size.width === source.width && size.height === source.height ? {} : { resize: size };
	const width = transform.width && Math.round(transform.width);
	const height = transform.height && Math.round(transform.height);

	if (!width || !height) {
		if (width) return plan(scaled(Math.min(width / source.width, 1)));
		if (height) return plan(scaled(Math.min(height / source.height, 1)));
		return {};
	}

	const xScale = width / source.width;
	const yScale = height / source.height;
	switch (transform.fit ? FIT_MAP[transform.fit] : 'cover') {
		case 'fill':
			return plan({
				width: Math.min(width, source.width),
				height: Math.min(height, source.height),
			});
		case 'outside':
			return plan(scaled(Math.min(Math.max(xScale, yScale), 1)));
		case 'cover': {
			const size = scaled(Math.min(Math.max(xScale, yScale), 1));
			const crop = { width: Math.min(width, size.width), height: Math.min(height, size.height) };
			const result = plan(size);
			if (crop.width < size.width || crop.height < size.height) {
				const [xRatio, yRatio] = positionRatios(transform.position);
				result.crop = {
					...crop,
					x: Math.round((size.width - crop.width) * xRatio),
					y: Math.round((size.height - crop.height) * yRatio),
				};
			}
			return result;
		}
		default:
			return plan(scaled(Math.min(xScale, yScale, 1)));
	}
}

function parseHexColor(color: string): [number, number, number] | undefined {
	const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim())?.[1];
	if (!hex) return undefined;
	const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
	return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as [
		number,
		number,
		number,
	];
}

function flattenAlphaToRgba(
	pixels: Uint8Array,
	pixelCount: number,
	[r, g, b]: [number, number, number],
): Uint8Array | undefined {
	const channels = pixels.length / pixelCount;
	if (channels !== 4 && channels !== 2) return undefined;
	const out = new Uint8Array(pixelCount * 4);
	for (let i = 0; i < pixelCount; i++) {
		const source = i * channels;
		const alpha = pixels[source + channels - 1] / 255;
		const red = pixels[source];
		const green = channels === 4 ? pixels[source + 1] : red;
		const blue = channels === 4 ? pixels[source + 2] : red;
		out[i * 4] = Math.round(red * alpha + r * (1 - alpha));
		out[i * 4 + 1] = Math.round(green * alpha + g * (1 - alpha));
		out[i * 4 + 2] = Math.round(blue * alpha + b * (1 - alpha));
		out[i * 4 + 3] = 255;
	}
	return out;
}

function encode(
	image: Transformer,
	format: string,
	quality: number | undefined,
	config: NapiImageServiceConfig,
): Promise<Buffer> {
	switch (format) {
		case 'webp':
			return image.webp(quality ?? config.webp?.quality ?? 80);
		case 'avif':
			return image.avif({ ...config.avif, quality: quality ?? config.avif?.quality ?? 50 });
		case 'png':
			return image.png(config.png);
		case 'jpeg':
		case 'jpg':
			return image.jpeg(quality ?? config.jpeg?.quality ?? 80);
		default:
			throw new AstroError(
				`The @napi-rs/image service cannot output \`${format}\` images.`,
				'Use one of `webp`, `avif`, `png` or `jpeg`.',
			);
	}
}

const napiImageService: LocalImageService<NapiImageServiceConfig> = {
	validateOptions: baseService.validateOptions,
	getURL: baseService.getURL,
	parseURL: baseService.parseURL,
	getHTMLAttributes: baseService.getHTMLAttributes,
	getSrcSet: baseService.getSrcSet,
	getRemoteSize: baseService.getRemoteSize,
	async transform(inputBuffer, transformOptions, imageConfig, logger) {
		const transform = transformOptions as Transform;
		const config: NapiImageServiceConfig = imageConfig.service.config ?? {};

		const metadata = await imageMetadata(inputBuffer, transform.src);
		const sourceFormat = metadata.format;
		const outputFormat = transform.format ?? (sourceFormat === 'svg' ? 'svg' : 'webp');

		if (outputFormat === 'svg') {
			if (sourceFormat !== 'svg') {
				logger.warn(
					`Astro expected an SVG for "${transform.src}" but the source is ${sourceFormat}. Passing it through as ${sourceFormat} instead.`,
				);
			}
			return { data: inputBuffer, format: sourceFormat as ImageOutputFormat };
		}
		if (sourceFormat === 'svg' && !imageConfig.dangerouslyProcessSVG) {
			throw new AstroError(
				`SVG image processing is disabled, but the source for "${transform.src}" is an SVG.`,
				'Pass it through unchanged by setting `format="svg"` on the component, or set `image.dangerouslyProcessSVG: true` to rasterize SVG sources.',
			);
		}

		const limit = config.limitInputPixels ?? DEFAULT_LIMIT_INPUT_PIXELS;
		if (limit !== false && metadata.width * metadata.height > limit) {
			throw new AstroError(
				`"${transform.src}" (${metadata.width}x${metadata.height}) exceeds the pixel limit of ${limit}.`,
				'Use a smaller image or raise `limitInputPixels` in the @napi-rs/image service config.',
			);
		}

		const plan = planResize(metadata, transform);

		try {
			let image =
				sourceFormat === 'svg'
					? Transformer.fromSvg(inputBuffer)
					: new Transformer(inputBuffer).rotate();
			// `fromSvg` ignores the SVG's intrinsic size, so SVG sources are always resized.
			const resize =
				plan.resize ??
				(sourceFormat === 'svg'
					? { width: Math.round(metadata.width), height: Math.round(metadata.height) }
					: undefined);
			if (resize) {
				image = image.fastResize({
					...resize,
					fit: ResizeFit.Fill,
					filter: FastResizeFilter.Lanczos3,
				});
			}
			if (plan.crop) {
				image = image.crop(plan.crop.x, plan.crop.y, plan.crop.width, plan.crop.height);
			}

			if (transform.background) {
				const color = parseHexColor(transform.background);
				if (!color) {
					logger.warn(
						`The @napi-rs/image service only supports hex background colors; "${transform.background}" for "${transform.src}" was ignored.`,
					);
				} else {
					const size = plan.crop ?? resize ?? metadata;
					const flattened = flattenAlphaToRgba(
						await image.rawPixels(),
						size.width * size.height,
						color,
					);
					if (flattened) image = Transformer.fromRgbaPixels(flattened, size.width, size.height);
				}
			}

			const quality = resolveQuality(transform.quality);
			return { data: await encode(image, outputFormat, quality, config), format: outputFormat };
		} catch (error) {
			if (error instanceof AstroError) throw error;
			// @napi-rs/image cannot decode some inputs (e.g. GIF), so they are used unoptimized.
			logger.warn(
				`Astro could not optimize image "${transform.src}" with @napi-rs/image (${(error as Error).message}). The image will be used unoptimized.`,
			);
			return { data: inputBuffer, format: sourceFormat as ImageOutputFormat };
		}
	},
};

export default napiImageService;
