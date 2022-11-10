/// <reference types="astro/astro-jsx" />
import type {
	ColorDefinition,
	ImageService,
	ImageTransform,
	OutputFormat,
	TransformOptions,
} from '../loaders/index.js';
import { isSSRService, parseAspectRatio } from '../loaders/index.js';

function resolveSize(transform: TransformOptions): ImageTransform {
	// keep width & height as provided
	if (transform.width && transform.height) {
		return transform as ImageTransform;
	}

	if (!transform.width && !transform.height) {
		throw new Error(`"width" and "height" cannot both be undefined`);
	}

	if (!transform.aspectRatio) {
		throw new Error(
			`"aspectRatio" must be included if only "${transform.width ? 'width' : 'height'}" is provided`
		);
	}

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
			aspectRatio: undefined,
		} as ImageTransform;
	} else if (transform.height) {
		// only height was provided, calculate width
		return {
			...transform,
			width: Math.round(transform.height * aspectRatio),
			height: transform.height,
			aspectRatio: undefined,
		} as ImageTransform;
	}

	return transform as ImageTransform;
}

async function resolveTransform(input: TransformOptions): Promise<ImageTransform> {
	// for remote images, only validate the width and height props
	if (typeof input.src === 'string') {
		return resolveSize(input);
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
