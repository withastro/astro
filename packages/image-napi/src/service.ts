import type {
	AvifConfig,
	ChromaSubsampling,
	FastResizeFilter as FastResizeFilterEnum,
	PngEncodeOptions,
	Transformer as TransformerClass,
} from '@napi-rs/image';
import type { ImageOutputFormat, LocalImageService } from 'astro';
import { baseService } from 'astro/assets';
import { imageMetadata } from 'astro/assets/utils';
import { AstroError } from 'astro/errors';

type ResizeFilterName = 'box' | 'bilinear' | 'hamming' | 'catmullRom' | 'mitchell' | 'lanczos3';

export interface NapiImageServiceConfig {
	/** Images with more pixels than this are rejected. Defaults to 0x3FFF * 0x3FFF; `false` disables the limit. */
	limitInputPixels?: number | false;
	/** Resampling filter used when resizing. Defaults to `lanczos3`. */
	resizeFilter?: ResizeFilterName;
	/** Default JPEG options. `quality` defaults to 80. */
	jpeg?: { quality?: number };
	/** Default PNG encoder options passed to `Transformer.png()`. */
	png?: PngEncodeOptions;
	/** Default WebP options. `quality` defaults to 80. */
	webp?: { quality?: number; lossless?: boolean };
	/**
	 * Default AVIF options passed to `Transformer.avif()`. `quality` defaults to 50.
	 * `chromaSubsampling` accepts strings such as `'4:2:0'` in addition to the enum.
	 */
	avif?: Omit<AvifConfig, 'chromaSubsampling'> & {
		chromaSubsampling?: ChromaSubsampling | '4:4:4' | '4:2:2' | '4:2:0' | '4:0:0';
	};
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

const DEFAULT_LIMIT_INPUT_PIXELS = 0x3fff * 0x3fff;

const DEFAULT_QUALITY = { jpeg: 80, webp: 80, avif: 50 } as const;

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

export function resolveQuality(quality: Transform['quality']): number | undefined {
	if (quality === undefined || quality === '') return undefined;
	if (typeof quality === 'number') return quality;
	if (quality in QUALITY_PRESETS) return QUALITY_PRESETS[quality];
	const parsed = Number.parseInt(quality, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
}

export interface ResizePlan {
	resize?: { width: number; height: number };
	crop?: { x: number; y: number; width: number; height: number };
}

// Computed here because @napi-rs/image's resize upscales, and images must never be enlarged.
export function planResize(
	sourceWidth: number,
	sourceHeight: number,
	transform: Pick<Transform, 'width' | 'height' | 'fit' | 'position'>,
): ResizePlan {
	const targetWidth = transform.width ? Math.round(transform.width) : undefined;
	const targetHeight = transform.height ? Math.round(transform.height) : undefined;
	const scaled = (scale: number) => ({
		width: Math.max(1, Math.round(sourceWidth * scale)),
		height: Math.max(1, Math.round(sourceHeight * scale)),
	});
	const plan = (size: { width: number; height: number }): ResizePlan =>
		size.width === sourceWidth && size.height === sourceHeight ? {} : { resize: size };

	if (targetWidth && targetHeight) {
		const fit = transform.fit ? (FIT_MAP[transform.fit] ?? 'inside') : 'cover';
		const xScale = targetWidth / sourceWidth;
		const yScale = targetHeight / sourceHeight;
		switch (fit) {
			case 'fill':
				return plan({
					width: Math.min(targetWidth, sourceWidth),
					height: Math.min(targetHeight, sourceHeight),
				});
			case 'inside':
				return plan(scaled(Math.min(xScale, yScale, 1)));
			case 'outside':
				return plan(scaled(Math.min(Math.max(xScale, yScale), 1)));
			case 'cover': {
				const size = scaled(Math.min(Math.max(xScale, yScale), 1));
				const result = plan(size);
				const width = Math.min(targetWidth, size.width);
				const height = Math.min(targetHeight, size.height);
				if (width < size.width || height < size.height) {
					const [xRatio, yRatio] = parsePosition(transform.position);
					result.crop = {
						x: Math.round((size.width - width) * xRatio),
						y: Math.round((size.height - height) * yRatio),
						width,
						height,
					};
				}
				return result;
			}
		}
	}
	if (targetWidth) return plan(scaled(Math.min(targetWidth / sourceWidth, 1)));
	if (targetHeight) return plan(scaled(Math.min(targetHeight / sourceHeight, 1)));
	return {};
}

const KEYWORD_RATIOS: Record<string, { axis: 'x' | 'y' | 'both'; ratio: number }> = {
	left: { axis: 'x', ratio: 0 },
	right: { axis: 'x', ratio: 1 },
	top: { axis: 'y', ratio: 0 },
	bottom: { axis: 'y', ratio: 1 },
	center: { axis: 'both', ratio: 0.5 },
	centre: { axis: 'both', ratio: 0.5 },
};

const GRAVITY_RATIOS: Record<string, [number, number]> = {
	north: [0.5, 0],
	northeast: [1, 0],
	east: [1, 0.5],
	southeast: [1, 1],
	south: [0.5, 1],
	southwest: [0, 1],
	west: [0, 0.5],
	northwest: [0, 0],
};

export function parsePosition(position: string | undefined): [number, number] {
	const value = position?.trim().toLowerCase().replace(/\s+/g, ' ');
	if (!value) return [0.5, 0.5];
	const gravity = GRAVITY_RATIOS[value.replace(/ /g, '')];
	if (gravity) return gravity;

	let x: number | undefined;
	let y: number | undefined;
	const unqualified: number[] = [];
	for (const token of value.split(' ')) {
		const keyword = KEYWORD_RATIOS[token];
		if (keyword?.axis === 'x') x = keyword.ratio;
		else if (keyword?.axis === 'y') y = keyword.ratio;
		else if (keyword) unqualified.push(keyword.ratio);
		else if (/^-?\d+(\.\d+)?%$/.test(token)) unqualified.push(Number.parseFloat(token) / 100);
		else return [0.5, 0.5];
	}
	for (const ratio of unqualified) {
		if (x === undefined) x = ratio;
		else if (y === undefined) y = ratio;
	}
	const clamp = (n: number) => Math.min(1, Math.max(0, n));
	return [clamp(x ?? 0.5), clamp(y ?? 0.5)];
}

const NAMED_COLORS: Record<string, [number, number, number]> = {
	black: [0, 0, 0],
	white: [255, 255, 255],
	red: [255, 0, 0],
	green: [0, 128, 0],
	blue: [0, 0, 255],
	gray: [128, 128, 128],
	grey: [128, 128, 128],
};

export function parseColor(color: string): [number, number, number] | undefined {
	const value = color.trim().toLowerCase();
	if (value in NAMED_COLORS) return NAMED_COLORS[value];
	const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value)?.[1];
	if (hex) {
		const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
		return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as [
			number,
			number,
			number,
		];
	}
	const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/.exec(value);
	if (rgb) {
		return [rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, Number(n))) as [
			number,
			number,
			number,
		];
	}
	return undefined;
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

const CHROMA_SUBSAMPLING: Record<string, number> = {
	'4:4:4': 0,
	'4:2:2': 1,
	'4:2:0': 2,
	'4:0:0': 3,
};

const FILTERS: Record<ResizeFilterName, keyof typeof FastResizeFilterEnum> = {
	box: 'Box',
	bilinear: 'Bilinear',
	hamming: 'Hamming',
	catmullRom: 'CatmullRom',
	mitchell: 'Mitchell',
	lanczos3: 'Lanczos3',
};

let napi: typeof import('@napi-rs/image') | undefined;

async function loadNapi(): Promise<typeof import('@napi-rs/image')> {
	try {
		napi ??= await import('@napi-rs/image');
	} catch (cause) {
		const error = new AstroError(
			'Could not load `@napi-rs/image`.',
			'Make sure `@napi-rs/image` is installed with optional dependencies enabled so the native binary for your platform is available.',
		);
		error.cause = cause;
		throw error;
	}
	return napi;
}

function encode(
	image: TransformerClass,
	format: string,
	quality: number | undefined,
	config: NapiImageServiceConfig,
): Promise<Buffer> {
	switch (format) {
		case 'webp':
			if (quality === undefined && config.webp?.lossless) return image.webpLossless();
			return image.webp(quality ?? config.webp?.quality ?? DEFAULT_QUALITY.webp);
		case 'avif': {
			const { chromaSubsampling, ...avif } = config.avif ?? {};
			return image.avif({
				...avif,
				quality: quality ?? avif.quality ?? DEFAULT_QUALITY.avif,
				...(chromaSubsampling !== undefined && {
					chromaSubsampling:
						typeof chromaSubsampling === 'string'
							? CHROMA_SUBSAMPLING[chromaSubsampling]
							: chromaSubsampling,
				}),
			});
		}
		case 'png':
			return image.png(config.png);
		case 'jpeg':
		case 'jpg':
			return image.jpeg(quality ?? config.jpeg?.quality ?? DEFAULT_QUALITY.jpeg);
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

		const { Transformer, FastResizeFilter, ResizeFit } = await loadNapi();
		const plan = planResize(metadata.width, metadata.height, transform);
		const quality = resolveQuality(transform.quality);

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
					filter: FastResizeFilter[FILTERS[config.resizeFilter ?? 'lanczos3']],
				});
			}
			if (plan.crop) {
				image = image.crop(plan.crop.x, plan.crop.y, plan.crop.width, plan.crop.height);
			}

			if (transform.background) {
				const color = parseColor(transform.background);
				if (!color) {
					logger.warn(
						`The @napi-rs/image service does not understand the background color "${transform.background}" for "${transform.src}"; it was ignored.`,
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
