import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import slash from 'slash';
import { ensureDir, isRemoteImage, loadLocalImage, loadRemoteImage, propsToFilename } from './utils.js';
import { createPlugin } from './vite-plugin-astro-image.js';
import type { AstroConfig, AstroIntegration } from 'astro';
import type { ImageAttributes, IntegrationOptions, SSRImageService, TransformOptions } from './types';

const PKG_NAME = '@astrojs/image';
const ROUTE_PATTERN = '/_image';
const OUTPUT_DIR = '/_image';

/**
 * Gets the HTML attributes required to build an `<img />` for the transformed image.
 * 
 * @param loader @type {ImageService} The image service used for transforming images.
 * @param transform @type {TransformOptions} The transformations requested for the optimized image.
 * @returns @type {ImageAttributes} The HTML attributes to be included on the built `<img />` element.
 */
export async function getImage(loader: SSRImageService, transform: TransformOptions): Promise<ImageAttributes> {
	(globalThis as any).loader = loader;

  const attributes = await loader.getImageAttributes(transform);

	// For SSR services, build URLs for the injected route
	if (typeof loader.transform === 'function') {
		const { searchParams } = loader.serializeTransform(transform);

		// cache all images rendered to HTML
		if (globalThis && (globalThis as any).addStaticImage) {
			(globalThis as any)?.addStaticImage(transform);
		}

		const src = globalThis && (globalThis as any).filenameFormat
			? (globalThis as any).filenameFormat(transform, searchParams)
			: `${ROUTE_PATTERN}?${searchParams.toString()}`;

			return {
				...attributes,
				src: slash(src), // Windows compat
			}
	}

	// For hosted services, return the <img /> attributes as-is
	return attributes;
}

const createIntegration = (options: IntegrationOptions = {}): AstroIntegration => {
	const resolvedOptions = {
		serviceEntryPoint: '@astrojs/image/sharp',
		...options
	};

	// During SSG builds, this is used to track all transformed images required.
	const staticImages = new Map<string, TransformOptions>();

	let _config: AstroConfig;

	function getViteConfiguration() {
		return {
			plugins: [
				createPlugin(_config, resolvedOptions)
			]
		}
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
				}

				// TODO: Add support for custom, user-provided filename format functions
				(globalThis as any).filenameFormat = (transform: TransformOptions, searchParams: URLSearchParams) => {
					if (mode === 'ssg') {
						return isRemoteImage(transform.src)
							? path.join(OUTPUT_DIR, path.basename(propsToFilename(transform)))
							: path.join(OUTPUT_DIR, path.dirname(transform.src), path.basename(propsToFilename(transform)));
					} else {
						return `${ROUTE_PATTERN}?${searchParams.toString()}`;
					}
				}

				if (mode === 'ssr') {
					injectRoute({
						pattern: ROUTE_PATTERN,
						entryPoint: command === 'dev' ? '@astrojs/image/endpoints/dev' : '@astrojs/image/endpoints/prod'
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

						const outputFileURL = new URL(path.join('./', OUTPUT_DIR, path.basename(filename)), dir);
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
			}
		}
	}
}

export default createIntegration;
