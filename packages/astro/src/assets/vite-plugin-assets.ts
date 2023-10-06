import MagicString from 'magic-string';
import type * as vite from 'vite';
import { normalizePath } from 'vite';
import type { AstroPluginOptions, ImageTransform } from '../@types/astro.js';
import { extendManualChunks } from '../core/build/plugins/util.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeQueryString,
} from '../core/path.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { VALID_INPUT_FORMATS, VIRTUAL_MODULE_ID, VIRTUAL_SERVICE_ID } from './consts.js';
import { emitESMImage } from './utils/emitAsset.js';
import { hashTransform, propsToFilename } from './utils/transformToPath.js';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

const assetRegex = new RegExp(`\\.(${VALID_INPUT_FORMATS.join('|')})$`, 'i');

export default function assets({
	settings,
	mode,
}: AstroPluginOptions & { mode: string }): vite.Plugin[] {
	let resolvedConfig: vite.ResolvedConfig;

	globalThis.astroAsset = {};

	return [
		// Expose the components and different utilities from `astro:assets` and handle serving images from `/_image` in dev
		{
			name: 'astro:assets',
			outputOptions(outputOptions) {
				// Specifically split out chunk for asset files to prevent TLA deadlock
				// caused by `getImage()` for markdown components.
				// https://github.com/rollup/rollup/issues/4708
				extendManualChunks(outputOptions, {
					after(id) {
						if (id.includes('astro/dist/assets/services/')) {
							return `astro-assets-services`;
						}
					},
				});
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
					export { default as Picture } from "astro/components/Picture.astro";

					export const imageConfig = ${JSON.stringify(settings.config.image)};
					export const assetsDir = new URL(${JSON.stringify(
						new URL(
							isServerLikeOutput(settings.config)
								? settings.config.build.client
								: settings.config.outDir
						)
					)});
					export const getImage = async (options) => await getImageInternal(options, imageConfig);
				`;
				}
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
						map: resolvedConfig.build.sourcemap ? s.generateMap({ hires: 'boundary' }) : null,
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
				// If our import has any query params, we'll let Vite handle it
				// See https://github.com/withastro/astro/issues/8333
				if (id !== removeQueryString(id)) {
					return;
				}
				if (assetRegex.test(id)) {
					const meta = await emitESMImage(id, this.meta.watchMode, this.emitFile);

					if (!meta) {
						throw new AstroError({
							...AstroErrorData.ImageNotFound,
							message: AstroErrorData.ImageNotFound.message(id),
						});
					}

					return `export default ${JSON.stringify(meta)}`;
				}
			},
		},
	];
}
