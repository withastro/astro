import type { AstroConfig, AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { OUTPUT_DIR, PKG_NAME, ROUTE_PATTERN } from './constants.js';
import sharp from './loaders/sharp.js';
import { IntegrationOptions, TransformOptions } from './types.js';
import {
	ensureDir,
	isRemoteImage,
	loadLocalImage,
	loadRemoteImage,
	propsToFilename,
} from './utils.js';
import { createPlugin } from './vite-plugin-astro-image.js';
export * from './get-image.js';
export * from './get-picture.js';

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
			ssr: {
				noExternal: ['@astrojs/image'],
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
				function addStaticImage(transform: TransformOptions) {
					staticImages.set(propsToFilename(transform), transform);
				};

				// TODO: Add support for custom, user-provided filename format functions
				function filenameFormat(
					transform: TransformOptions,
					searchParams: URLSearchParams
				) {
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

				// Initialize the integration's globalThis namespace
				// This is needed to share scope between Node and Vite
				globalThis.astroImage = {
					loader: undefined, // initialized in first getImage() call
					ssrLoader: sharp,
					command,
					addStaticImage,
					filenameFormat,
				}

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
					const loader = globalThis.astroImage.loader;

					if (!loader || !('transform' in loader)) {
						// this should never be hit, how was a staticImage added without an SSR service?
						return;
					}

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
						// eslint-disable-next-line no-console
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
