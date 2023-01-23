/// <reference types="astro/astro-jsx" />
import probe from 'probe-image-size';
import type {
	ColorDefinition,
	ImageService,
	OutputFormat,
	TransformOptions,
} from '../loaders/index.js';
import { isSSRService, parseAspectRatio } from '../loaders/index.js';
import { metadata as imageMetadata } from '../utils/metadata.js';
import { isRemoteImage } from '../utils/paths.js';
import type { ImageMetadata } from '../vite-plugin-astro-image.js';

export interface GetImageTransform extends Omit<TransformOptions, 'src'> {
	src: string | ImageMetadata | Promise<{ default: ImageMetadata }>;
	alt: string;
}

async function resolveSize(transform: TransformOptions): Promise<TransformOptions> {
	// If the user provided a width and a height, let's directly go with that
	if (transform.width && transform.height) {
		return transform;
	}

	transform.format = 'jpg';

	// If the user provided an aspect ratio, and just one of width or height, let's try to make the image fit their need
	if (transform.aspectRatio && (transform.width || transform.height)) {
		let aspectRatio: number;

		// parse aspect ratio strings, if required (ex: "16:9")
		if (typeof transform.aspectRatio === 'number') {
			aspectRatio = transform.aspectRatio;
		} else {
			const [width, height] = transform.aspectRatio.split(':');
			aspectRatio = Number.parseInt(width) / Number.parseInt(height);
		}

		if (transform.width) {
			// only width was provided, calculate height
			return {
				...transform,
				width: transform.width,
				height: Math.round(transform.width / aspectRatio),
			} as TransformOptions;
		} else if (transform.height) {
			// only height was provided, calculate width
			return {
				...transform,
				width: Math.round(transform.height * aspectRatio),
				height: transform.height,
			};
		}
	}

	// If it's not a remote image, we have access to the local file and can tell the aspect ratio
	if (!isRemoteImage(transform.src)) {
		let data;

		try {
			data = await imageMetadata(transform.src);
		} catch (e) {
			// TODO: Do this properly, just done like this for now as a proof of concept
			data = await imageMetadata('./public' + transform.src);
		}

		if (data) {
			const aspectRatio = data.width / data.height;

			if (!transform.format) transform.format = data.format as OutputFormat;

			if (transform.width) {
				// only width was provided, calculate height
				return {
					...transform,
					width: transform.width,
					height: Math.round(transform.width / aspectRatio),
				} as TransformOptions;
			} else if (transform.height) {
				// only height was provided, calculate width
				return {
					...transform,
					width: Math.round(transform.height * aspectRatio),
					height: transform.height,
				};
			} else {
				// neither width or height were provided, so just return as is
				return {
					...transform,
					width: data.width,
					height: data.height,
				};
			}
		}
	} else {
		const imageData = await probe(transform.src);
		if (!transform.format) transform.format = imageData.type as OutputFormat;

		if (!transform.width || !transform.height) {
			if (imageData) {
				let aspectRatio;
				if (transform.aspectRatio) {
					if (typeof transform.aspectRatio === 'number') {
						aspectRatio = transform.aspectRatio;
					} else {
						const [width, height] = transform.aspectRatio.split(':');
						aspectRatio = Number.parseInt(width) / Number.parseInt(height);
					}
				}

				aspectRatio = aspectRatio ? aspectRatio : imageData.width / imageData.height;

				if (transform.width) {
					// only width was provided, calculate height
					return {
						...transform,
						width: transform.width,
						height: Math.round(transform.width / aspectRatio),
					} as TransformOptions;
				} else if (transform.height) {
					// only height was provided, calculate width
					return {
						...transform,
						width: Math.round(transform.height * aspectRatio),
						height: transform.height,
					};
				} else {
					// neither width or height were provided, so just return as is
					return {
						...transform,
						width: imageData.width,
						height: imageData.height,
					};
				}
			}
		}
	}

	return transform;
}

async function resolveTransform(input: GetImageTransform): Promise<TransformOptions> {
	// For non-statically analyzable images (remote, dynamic file paths etc), only validate the width and height props
	if (typeof input.src === 'string') {
		return await resolveSize(input as TransformOptions);
	}

	// resolve the metadata promise, usually when the ESM import is inlined
	const metadata = 'then' in input.src ? (await input.src).default : input.src;

	let { width, height, aspectRatio, background, format = metadata.format, ...rest } = input;

	if (!width && !height) {
		// neither dimension was provided, use the file metadata
		width = metadata.width;
		height = metadata.height;
	} else if (width) {
		// one dimension was provided, calculate the other
		let ratio = parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
		height = height || Math.round(width / ratio);
	} else if (height) {
		// one dimension was provided, calculate the other
		let ratio = parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
		width = width || Math.round(height * ratio);
	}

	return {
		...rest,
		src: metadata.src,
		width,
		height,
		aspectRatio,
		format: format as OutputFormat,
		background: background as ColorDefinition | undefined,
	};
}

/**
 * Gets the HTML attributes required to build an `<img />` for the transformed image.
 *
 * @param transform @type {TransformOptions} The transformations requested for the optimized image.
 * @returns @type {ImageAttributes} The HTML attributes to be included on the built `<img />` element.
 */
export async function getImage(
	transform: GetImageTransform
): Promise<astroHTML.JSX.ImgHTMLAttributes> {
	if (!transform.src) {
		throw new Error('[@astrojs/image] `src` is required');
	}

	let loader = globalThis.astroImage?.loader;

	if (!loader) {
		// @ts-ignore
		const { default: mod } = await import('virtual:image-loader').catch(() => {
			throw new Error(
				'[@astrojs/image] Builtin image loader not found. (Did you remember to add the integration to your Astro config?)'
			);
		});
		loader = mod as ImageService;
		globalThis.astroImage = globalThis.astroImage || {};
		globalThis.astroImage.loader = loader;
	}

	const resolved = await resolveTransform(transform);

	const attributes = await loader.getImageAttributes(resolved);

	// `.env` must be optional to support running in environments outside of `vite` (such as `astro.config`)
	// @ts-ignore
	const isDev = import.meta.env?.DEV;
	const isLocalImage = !isRemoteImage(resolved.src);

	const _loader = isDev && isLocalImage ? globalThis.astroImage.defaultLoader : loader;

	if (!_loader) {
		throw new Error('@astrojs/image: loader not found!');
	}

	const { searchParams } = isSSRService(_loader)
		? _loader.serializeTransform(resolved)
		: globalThis.astroImage.defaultLoader.serializeTransform(resolved);

	const imgSrc =
		!isLocalImage && resolved.src.startsWith('//') ? `https:${resolved.src}` : resolved.src;
	let src: string;

	if (/^[\/\\]?@astroimage/.test(imgSrc)) {
		src = `${imgSrc}?${searchParams.toString()}`;
	} else {
		searchParams.set('href', imgSrc);
		src = `/_image?${searchParams.toString()}`;
	}

	// cache all images rendered to HTML
	if (globalThis.astroImage?.addStaticImage) {
		src = globalThis.astroImage.addStaticImage(resolved);
	}

	return {
		...attributes,
		src,
	};
}
