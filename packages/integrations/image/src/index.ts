import type { AstroConfig, AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import slash from 'slash';
import { fileURLToPath } from 'url';
import {
	ImageAttributes,
	ImageMetadata,
	ImageService,
	IntegrationOptions,
	isSSRService,
	OutputFormat,
	TransformOptions,
} from './types.js';
import {
	ensureDir,
	isRemoteImage,
	loadLocalImage,
	loadRemoteImage,
	parseAspectRatio,
	propsToFilename,
} from './utils.js';
import { createPlugin } from './vite-plugin-astro-image.js';

const PKG_NAME = '@astrojs/image';
const ROUTE_PATTERN = '/_image';
const OUTPUT_DIR = '/_image';

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
		aspectRatio = parseInt(width) / parseInt(height);
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

function getImageAttributes(src: string, transform: TransformOptions): ImageAttributes {
	return {
		loading: 'lazy',
		decoding: 'async',
		src,
		width: transform.width,
		height: transform.height
	};
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

		// Windows compat
		return getImageAttributes(slash(src), resolved);
	}

	// For hosted services, return the `src` attribute as-is
	return getImageAttributes(await loader.getImageSrc(resolved), resolved);
}

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const resolvedOptions = {
		serviceEntryPoint: '@astrojs/image/sharp',
		...options,
	};

	// During SSG builds, this is used to track all transformed images required.
	const staticImages = new Map<string, TransformOptions>();

	let _config: AstroConfig;

	function getViteConfiguration() {
		return {
			plugins: [createPlugin(_config, resolvedOptions)],
			optimizeDeps: {
				include: ['image-size', 'sharp'],
			},
		};
	}

	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': ({ command, config, injectRoute, updateConfig }) => {
				_config = config;

				// Always treat `astro dev` as SSR mode, even without an adapter
				const mode = command === 'dev' || config.adapter ? 'ssr' : 'ssg';

				updateConfig({ vite: getViteConfiguration() });

				// Used to cache all images rendered to HTML
				// Added to globalThis to share the same map in Node and Vite
				(globalThis as any).addStaticImage = (transform: TransformOptions) => {
					staticImages.set(propsToFilename(transform), transform);
				};

				// TODO: Add support for custom, user-provided filename format functions
				(globalThis as any).filenameFormat = (
					transform: TransformOptions,
					searchParams: URLSearchParams
				) => {
					if (mode === 'ssg') {
						return isRemoteImage(transform.src)
							? path.join(OUTPUT_DIR, path.basename(propsToFilename(transform)))
							: path.join(
									OUTPUT_DIR,
									path.dirname(transform.src),
									path.basename(propsToFilename(transform))
							  );
					} else {
						return `${ROUTE_PATTERN}?${searchParams.toString()}`;
					}
				};

				if (mode === 'ssr') {
					injectRoute({
						pattern: ROUTE_PATTERN,
						entryPoint:
							command === 'dev' ? '@astrojs/image/endpoints/dev' : '@astrojs/image/endpoints/prod',
					});
				}
			},
			'astro:build:done': async ({ dir }) => {
				for await (const [filename, transform] of staticImages) {
					const loader = (globalThis as any).loader;

					let inputBuffer: Buffer | undefined = undefined;
					let outputFile: string;

					if (isRemoteImage(transform.src)) {
						// try to load the remote image
						inputBuffer = await loadRemoteImage(transform.src);

						const outputFileURL = new URL(
							path.join('./', OUTPUT_DIR, path.basename(filename)),
							dir
						);
						outputFile = fileURLToPath(outputFileURL);
					} else {
						const inputFileURL = new URL(`.${transform.src}`, _config.srcDir);
						const inputFile = fileURLToPath(inputFileURL);
						inputBuffer = await loadLocalImage(inputFile);

						const outputFileURL = new URL(path.join('./', OUTPUT_DIR, filename), dir);
						outputFile = fileURLToPath(outputFileURL);
					}

					if (!inputBuffer) {
						console.warn(`"${transform.src}" image could not be fetched`);
						continue;
					}

					const { data } = await loader.transform(inputBuffer, transform);
					ensureDir(path.dirname(outputFile));
					await fs.writeFile(outputFile, data);
				}
			},
		},
	};
};

export default createIntegration;
