import slash from 'slash';
import { ROUTE_PATTERN } from './constants.js';
import { ImageAttributes, ImageMetadata, ImageService, isSSRService, OutputFormat, TransformOptions } from './types.js';
import { parseAspectRatio } from './utils.js';

export interface GetImageTransform extends Omit<TransformOptions, 'src'> {
	src: string | ImageMetadata | Promise<{ default: ImageMetadata }>;
}

function resolveSize(transform: TransformOptions): TransformOptions {
	// keep width & height as provided
	if (transform.width && transform.height) {
		return transform;
	}

	if (!transform.width && !transform.height) {
		throw new Error(`"width" and "height" cannot both be undefined`);
	}

	if (!transform.aspectRatio) {
		throw new Error(`"aspectRatio" must be included if only "${transform.width ? "width": "height"}" is provided`)
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
			height: Math.round(transform.width / aspectRatio)
		} as TransformOptions;
	} else if (transform.height) {
	// only height was provided, calculate width
		return {
			...transform,
			width: Math.round(transform.height * aspectRatio),
			height: transform.height
		};
	}

	return transform;
}

async function resolveTransform(input: GetImageTransform): Promise<TransformOptions> {
	// for remote images, only validate the width and height props
	if (typeof input.src === 'string') {
		return resolveSize(input as TransformOptions);
	}

	// resolve the metadata promise, usually when the ESM import is inlined
	const metadata = 'then' in input.src
		? (await input.src).default
		: input.src;

	let { width, height, aspectRatio, format = metadata.format, ...rest } = input;

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
	}
}

/**
 * Gets the HTML attributes required to build an `<img />` for the transformed image.
 *
 * @param loader @type {ImageService} The image service used for transforming images.
 * @param transform @type {TransformOptions} The transformations requested for the optimized image.
 * @returns @type {ImageAttributes} The HTML attributes to be included on the built `<img />` element.
 */
 export async function getImage(
	loader: ImageService,
	transform: GetImageTransform
): Promise<ImageAttributes> {
	(globalThis as any).loader = loader;

	const resolved = await resolveTransform(transform);
	const attributes = await loader.getImageAttributes(resolved);

	// For SSR services, build URLs for the injected route
	if (isSSRService(loader)) {
		const { searchParams } = loader.serializeTransform(resolved);

		// cache all images rendered to HTML
		if (globalThis && (globalThis as any).addStaticImage) {
			(globalThis as any)?.addStaticImage(resolved);
		}

		const src =
			globalThis && (globalThis as any).filenameFormat
				? (globalThis as any).filenameFormat(resolved, searchParams)
				: `${ROUTE_PATTERN}?${searchParams.toString()}`;

		return {
			...attributes,
			src: slash(src), // Windows compat
		};
	}

	// For hosted services, return the `<img />` attributes as-is
	return attributes;
}
