/// <reference types="astro/astro-jsx" />
import {
	ColorDefinition,
	ImageService,
	ImageTransform,
	isRemoteTransform,
	OutputFormat,
	TransformOptions,
} from '../loaders/index.js';
import { isSSRService, parseAspectRatio } from '../loaders/index.js';

function safeParseInt(candidate?: string | number): number | undefined {
	if (typeof candidate === 'number') {
		return candidate;
	}

	if (typeof candidate !== 'string') {
		return undefined;
	}

	try {
		return parseInt(candidate)
	} catch {
		return undefined
	}
}

function resolveSize(transform: TransformOptions): ImageTransform {
	const safeWidth = safeParseInt(transform.width);
	const safeHeight = safeParseInt(transform.height);

	// keep width & height as provided
	if (safeWidth && safeHeight) {
		return {
			...transform,
			height: safeHeight,
			width: safeWidth
		} as ImageTransform;
	}

	if (!safeWidth && !safeHeight) {
		return transform as ImageTransform;
	}

	let aspectRatio: number | undefined = undefined;

	// parse aspect ratio strings, if required (ex: "16:9")
	if (typeof transform.aspectRatio === 'number') {
		aspectRatio = transform.aspectRatio;
	} else if (typeof transform.aspectRatio === 'string') {
		const [width, height] = transform.aspectRatio.split(':');
		aspectRatio = Number.parseInt(width) / Number.parseInt(height);
	}

	if (safeWidth) {
		// only width was provided, calculate height
		return {
			...transform,
			width: safeWidth,
			height: aspectRatio ? Math.round(safeWidth / aspectRatio) : undefined,
			aspectRatio: undefined,
		} as ImageTransform;
	} else if (safeHeight) {
		// only height was provided, calculate width
		return {
			...transform,
			width: aspectRatio ? Math.round(safeHeight * aspectRatio) : undefined,
			height: safeHeight,
			aspectRatio: undefined,
		} as ImageTransform;
	}

	return transform as ImageTransform;
}

async function resolveTransform(input: TransformOptions): Promise<ImageTransform> {
	// for remote images, return the transform as-is since we can't use metadata from the original image
	if (isRemoteTransform(input)) {
		return resolveSize(input) as ImageTransform;
	}

	// resolve the metadata promise, usually when the ESM import is inlined
	const metadata = 'then' in input.src ? (await input.src).default : input.src;

	let { width, height, aspectRatio, background, format = metadata.format, ...rest } = input;

	width = safeParseInt(width);
	height = safeParseInt(height);

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
	} as ImageTransform;
}

/**
 * Gets the HTML attributes required to build an `<img />` for the transformed image.
 *
 * @param transform @type {TransformOptions} The transformations requested for the optimized image.
 * @returns @type {ImageAttributes} The HTML attributes to be included on the built `<img />` element.
 */
export async function getImage(
	transform: TransformOptions
): Promise<astroHTML.JSX.ImgHTMLAttributes> {
	if (!transform.src) {
		throw new Error('[@astrojs/image] `src` is required');
	}

	if (isRemoteTransform(transform) && !transform.format) {
		throw new Error('[@astrojs/image] `format` is required for remote images');
	}

	let loader = transform.loader || globalThis.astroImage?.loader;

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

	const { src, ...attributes } = await loader.getImageAttributes(resolved);

	return {
		/**
		 * addStaticImage will only be defined during static builds
		 * If an SSR image service was loaded, generate a src for the image
		 * based on the hashed image that will be built to /dist
		 */
		src: isSSRService(loader) && globalThis.astroImage?.addStaticImage
			? globalThis.astroImage.addStaticImage(resolved)
			: src,
		...attributes
	}
}
