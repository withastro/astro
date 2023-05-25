import { bold } from 'kleur/colors';
import MagicString from 'magic-string';
import mime from 'mime/lite.js';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { normalizePath } from 'vite';
import type { AstroPluginOptions, ImageTransform } from '../@types/astro';
import { error } from '../core/logger/core.js';
import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeQueryString,
} from '../core/path.js';
import { VIRTUAL_MODULE_ID, VIRTUAL_SERVICE_ID } from './consts.js';
import { isESMImportedImage } from './internal.js';
import { isLocalService } from './services/service.js';
import { emitESMImage } from './utils/emitAsset.js';
import { imageMetadata } from './utils/metadata.js';
import { getOrigQueryParams } from './utils/queryParams.js';
import { hashTransform, propsToFilename } from './utils/transformToPath.js';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

const rawRE = /(?:\?|&)raw(?:&|$)/;
const urlRE = /(\?|&)url(?:&|$)/;

export default function assets({
	settings,
	logging,
	mode,
}: AstroPluginOptions & { mode: string }): vite.Plugin[] {
	let resolvedConfig: vite.ResolvedConfig;

	globalThis.astroAsset = {};

	const UNSUPPORTED_ADAPTERS = new Set([
		'@astrojs/cloudflare',
		'@astrojs/deno',
		'@astrojs/netlify/edge-functions',
		'@astrojs/vercel/edge',
	]);

	const adapterName = settings.config.adapter?.name;
	if (
		['astro/assets/services/sharp', 'astro/assets/services/squoosh'].includes(
			settings.config.image.service.entrypoint
		) &&
		adapterName &&
		UNSUPPORTED_ADAPTERS.has(adapterName)
	) {
		error(
			logging,
			'assets',
			`The currently selected adapter \`${adapterName}\` does not run on Node, however the currently used image service depends on Node built-ins. ${bold(
				'Your project will NOT be able to build.'
			)}`
		);
	}

	return [
		// Expose the components and different utilities from `astro:assets` and handle serving images from `/_image` in dev
		{
			name: 'astro:assets',
			config() {
				return {
					resolve: {
						alias: [
							{
								find: /^~\/assets\/(.+)$/,
								replacement: fileURLToPath(new URL('./assets/$1', settings.config.srcDir)),
							},
						],
					},
				};
			},
			async resolveId(id) {
				if (id === VIRTUAL_SERVICE_ID) {
					return await this.resolve(settings.config.image.service.entrypoint);
				}
				if (id === VIRTUAL_MODULE_ID) {
					return resolvedVirtualModuleId;
				}
			},
			load(id) {
				if (id === resolvedVirtualModuleId) {
					return `
					export { getConfiguredImageService, isLocalService } from "astro/assets";
					import { getImage as getImageInternal } from "astro/assets";
					export { default as Image } from "astro/components/Image.astro";

					export const imageServiceConfig = ${JSON.stringify(settings.config.image.service.config)};
					export const getImage = async (options) => await getImageInternal(options, imageServiceConfig);
				`;
				}
			},
			// Handle serving images during development
			configureServer(server) {
				server.middlewares.use(async (req, res, next) => {
					if (req.url?.startsWith('/_image')) {
						// If the currently configured service isn't a local service, we don't need to do anything here.
						// TODO: Support setting a specific service through a prop on Image / a parameter in getImage
						if (!isLocalService(globalThis.astroAsset.imageService)) {
							return next();
						}

						const url = new URL(req.url, 'file:');
						const filePath = url.searchParams.get('href');

						if (!filePath) {
							return next();
						}

						const filePathURL = new URL('.' + filePath, settings.config.root);
						const file = await fs.readFile(filePathURL);

						// Get the file's metadata from the URL
						let meta = getOrigQueryParams(filePathURL.searchParams);

						// If we don't have them (ex: the image came from Markdown, let's calculate them again)
						if (!meta) {
							meta = await imageMetadata(filePathURL, file);

							if (!meta) {
								return next();
							}
						}

						const transform = await globalThis.astroAsset.imageService.parseURL(
							url,
							settings.config.image.service.config
						);

						if (transform === undefined) {
							error(logging, 'image', `Failed to parse transform for ${url}`);
						}

						// if no transforms were added, the original file will be returned as-is
						let data = file;
						let format: string = meta.format;

						if (transform) {
							const result = await globalThis.astroAsset.imageService.transform(
								file,
								transform,
								settings.config.image.service.config
							);
							data = result.data;
							format = result.format;
						}

						res.setHeader('Content-Type', mime.getType(format) ?? `image/${format}`);
						res.setHeader('Cache-Control', 'max-age=360000');

						const stream = Readable.from(data);
						return stream.pipe(res);
					}

					return next();
				});
			},
			buildStart() {
				if (mode != 'build') {
					return;
				}

				globalThis.astroAsset.addStaticImage = (options) => {
					if (!globalThis.astroAsset.staticImages) {
						globalThis.astroAsset.staticImages = new Map<
							string,
							{ path: string; options: ImageTransform }
						>();
					}

					const hash = hashTransform(options, settings.config.image.service.entrypoint);

					let filePath: string;
					if (globalThis.astroAsset.staticImages.has(hash)) {
						filePath = globalThis.astroAsset.staticImages.get(hash)!.path;
					} else {
						// If the image is not imported, we can return the path as-is, since static references
						// should only point ot valid paths for builds or remote images
						if (!isESMImportedImage(options.src)) {
							return options.src;
						}

						filePath = prependForwardSlash(
							joinPaths(settings.config.build.assets, propsToFilename(options, hash))
						);
						globalThis.astroAsset.staticImages.set(hash, { path: filePath, options: options });
					}

					if (settings.config.build.assetsPrefix) {
						return joinPaths(settings.config.build.assetsPrefix, filePath);
					} else {
						return prependForwardSlash(joinPaths(settings.config.base, filePath));
					}
				};
			},
			// In build, rewrite paths to ESM imported images in code to their final location
			async renderChunk(code) {
				const assetUrlRE = /__ASTRO_ASSET_IMAGE__([a-z\d]{8})__(?:_(.*?)__)?/g;

				let match;
				let s;
				while ((match = assetUrlRE.exec(code))) {
					s = s || (s = new MagicString(code));
					const [full, hash, postfix = ''] = match;

					const file = this.getFileName(hash);
					const prefix = settings.config.build.assetsPrefix
						? appendForwardSlash(settings.config.build.assetsPrefix)
						: resolvedConfig.base;
					const outputFilepath = prefix + normalizePath(file + postfix);

					s.overwrite(match.index, match.index + full.length, outputFilepath);
				}

				if (s) {
					return {
						code: s.toString(),
						map: resolvedConfig.build.sourcemap ? s.generateMap({ hires: true }) : null,
					};
				} else {
					return null;
				}
			},
		},
		// Return a more advanced shape for images imported in ESM
		{
			name: 'astro:assets:esm',
			enforce: 'pre',
			configResolved(viteConfig) {
				resolvedConfig = viteConfig;
			},
			async load(id) {
				// If our import has the `?raw` or `?url` Vite query params, we'll let Vite handle it
				if (rawRE.test(id) || urlRE.test(id)) {
					return;
				}

				const cleanedUrl = removeQueryString(id);
				if (/\.(jpeg|jpg|png|tiff|webp|gif|svg)$/.test(cleanedUrl)) {
					const meta = await emitESMImage(id, this.meta.watchMode, this.emitFile, settings);
					return `export default ${JSON.stringify(meta)}`;
				}
			},
		},
	];
}
