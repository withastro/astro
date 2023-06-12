/// <reference types="astro/astro-jsx" />
import mime from 'mime';
import { parseAspectRatio, type OutputFormat, type TransformOptions } from '../loaders/index.js';
import { extname } from '../utils/paths.js';
import type { ImageMetadata } from '../vite-plugin-astro-image.js';
import { getImage } from './get-image.js';

export interface GetPictureParams {
	src: string | ImageMetadata | Promise<{ default: ImageMetadata }>;
	alt: string;
	widths: number[];
	formats: OutputFormat[];
	aspectRatio?: TransformOptions['aspectRatio'];
	fit?: TransformOptions['fit'];
	background?: TransformOptions['background'];
	position?: TransformOptions['position'];
}

export interface GetPictureResult {
	image: astroHTML.JSX.ImgHTMLAttributes;
	sources: { type: string; srcset: string }[];
}

async function resolveAspectRatio({ src, aspectRatio }: GetPictureParams) {
	if (typeof src === 'string') {
		return parseAspectRatio(aspectRatio);
	} else {
		const metadata = 'then' in src ? (await src).default : src;
		return parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
	}
}

async function resolveFormats({ src, formats }: GetPictureParams) {
	const unique = new Set(formats);

	if (typeof src === 'string') {
		unique.add(extname(src).replace('.', '') as OutputFormat);
	} else {
		const metadata = 'then' in src ? (await src).default : src;
		unique.add(extname(metadata.src).replace('.', '') as OutputFormat);
	}

	return Array.from(unique).filter(Boolean);
}

export async function getPicture(params: GetPictureParams): Promise<GetPictureResult> {
	const { src, alt, widths, fit, position, background } = params;

	if (!src) {
		throw new Error('[@astrojs/image] `src` is required');
	}

	if (!widths || !Array.isArray(widths)) {
		throw new Error('[@astrojs/image] at least one `width` is required. ex: `widths={[100]}`');
	}

	const aspectRatio = await resolveAspectRatio(params);

	if (!aspectRatio) {
		throw new Error('`aspectRatio` must be provided for remote images');
	}

	// always include the original image format
	const allFormats = await resolveFormats(params);
	const lastFormat = allFormats[allFormats.length - 1];
	const maxWidth = Math.max(...widths);

	let image: astroHTML.JSX.ImgHTMLAttributes;

	async function getSource(format: OutputFormat) {
		const imgs = await Promise.all(
			widths.map(async (width) => {
				const img = await getImage({
					src,
					alt,
					format,
					width,
					fit,
					position,
					background,
					aspectRatio,
				});

				if (format === lastFormat && width === maxWidth) {
					image = img;
				}

				return `${img.src?.replaceAll(' ', encodeURI)} ${width}w`;
			})
		);

		return {
			type: mime.getType(format) || format,
			srcset: imgs.join(','),
		};
	}

	const sources = await Promise.all(allFormats.map((format) => getSource(format)));

	return {
		sources,
		// @ts-expect-error image will always be defined
		image,
	};
}
