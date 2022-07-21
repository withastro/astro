import type { AstroConfig, AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import glob from 'tiny-glob';
import { fileURLToPath } from 'url';
import { generateImages } from './build/generate.js';
import { PKG_NAME, ROUTE_PATTERN } from './constants.js';
import { ensureDir, filenameFormat, propsToFilename } from './utils/paths.js';
import { IntegrationOptions, TransformOptions } from './types.js';
import { createPlugin } from './vite-plugin-astro-image.js';

export default function integration(options: IntegrationOptions = {}): AstroIntegration {
	const resolvedOptions = {
		serviceEntryPoint: '@astrojs/image/sharp',
		...options,
	};

	// During SSG builds, this is used to track all transformed images required.
	const staticImages = new Map<string, TransformOptions>();

	let _config: AstroConfig;
	let mode: 'ssr' | 'ssg';

	function getViteConfiguration() {
		return {
			plugins: [createPlugin(_config, resolvedOptions)],
			optimizeDeps: {
				include: ['image-size', 'sharp'],
			},
			ssr: {
				noExternal: ['@astrojs/image', resolvedOptions.serviceEntryPoint],
			},
		};
	}

	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': ({ command, config, injectRoute, updateConfig }) => {
				_config = config;

				// Always treat `astro dev` as SSR mode, even without an adapter
				mode = command === 'dev' || config.adapter ? 'ssr' : 'ssg';

				updateConfig({ vite: getViteConfiguration() });

				if (mode === 'ssr') {
					injectRoute({
						pattern: ROUTE_PATTERN,
						entryPoint:
							command === 'dev' ? '@astrojs/image/endpoints/dev' : '@astrojs/image/endpoints/prod',
					});
				}
			},
			'astro:server:setup': async () => {
				globalThis.astroImage = {};
			},
			'astro:build:setup': () => {
				// Used to cache all images rendered to HTML
				// Added to globalThis to share the same map in Node and Vite
				function addStaticImage(transform: TransformOptions) {
					staticImages.set(propsToFilename(transform), transform);
				}

				// Helpers for building static images should only be available for SSG
				globalThis.astroImage =
					mode === 'ssg'
						? {
								addStaticImage,
								filenameFormat,
						  }
						: {};
			},
			'astro:build:done': async ({ dir }) => {
				// Copy original assets to the output directory. In SSR, include all matching files in src
				const assets = new Set<{ from: string; to: string }>();
				if (mode === 'ssr') {
					const srcPath = fileURLToPath(_config.srcDir);
					const matches = await glob(
						`${srcPath}/**/*.{heic,heif,avif,jpeg,jpg,png,tiff,webp,gif}`,
						{ absolute: true }
					);
					for (const match of matches) {
						assets.add({
							from: match,
							to: match.replace(fileURLToPath(_config.srcDir), fileURLToPath(dir)),
						});
					}
				}

				const loader = globalThis?.astroImage?.loader;
				if (loader && 'transform' in loader && staticImages.size > 0) {
					await generateImages({ loader, staticImages, srcDir: _config.srcDir, outDir: dir });
				}

				// copy all static image assets to dist
				for await (const { from, to } of assets) {
					await ensureDir(path.dirname(to));
					await fs.copyFile(from, to);
				}
			},
		},
	};
}
