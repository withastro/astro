import fs from 'fs/promises';
import path from 'path';
import { ensureDir, isRemoteImage, loadImage, propsToFilename } from './utils.js';
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
 * @param props @type {TransformOptions} The transformations requested for the optimized image.
 * @returns @type {ImageAttributes} The HTML attributes to be included on the built `<img />` element.
 */
export async function getImage(loader: SSRImageService, props: TransformOptions): Promise<ImageAttributes> {
	(globalThis as any).loader = loader;

  const attributes = await loader.getImageAttributes(props);

	// For SSR services, build URLs for the injected route
	if (typeof loader.transform === 'function') {
		const { searchParams } = loader.serializeTransform(props);

		// cache all images rendered to HTML
		if (globalThis && (globalThis as any).addStaticImage) {
			(globalThis as any)?.addStaticImage(props);
		}

		const src = globalThis && (globalThis as any).filenameFormat
			? (globalThis as any).filenameFormat(props, searchParams)
			: `${ROUTE_PATTERN}?${searchParams.toString()}`;

			return {
				...attributes,
				src
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
				(globalThis as any).addStaticImage = (props: TransformOptions) => {
					staticImages.set(propsToFilename(props), props);
				}

				// TODO: Add support for custom, user-provided filename format functions
				(globalThis as any).filenameFormat = (props: TransformOptions, searchParams: URLSearchParams) => {
					if (mode === 'ssg') {
						return path.join(OUTPUT_DIR, path.dirname(props.src), path.basename(propsToFilename(props)));
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
				for await (const [_, props] of staticImages) {
					const loader = (globalThis as any).loader;

					// load and transform the input file
					const src = isRemoteImage(props.src)
						? props.src
						: path.join(_config.srcDir.pathname, props.src.replace(/^\/image/, ''));
					const inputBuffer = await loadImage(src);

					if (!inputBuffer) {
						console.warn(`"${props.src}" image not found`);
						continue;
					}
					
					const { data } = await loader.transform(inputBuffer, props);

					// output to dist folder
					const outputFile = path.join(dir.pathname, OUTPUT_DIR, propsToFilename(props));
					ensureDir(path.dirname(outputFile));
					await fs.writeFile(outputFile, data);
				}
			}
		}
	}
}

export default createIntegration;
