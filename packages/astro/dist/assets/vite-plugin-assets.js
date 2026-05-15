import { extname } from 'node:path';
import MagicString from 'magic-string';
import picomatch from 'picomatch';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeBase,
	removeQueryString,
} from '../core/path.js';
import { normalizePath } from '../core/viteUtils.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { isAstroServerEnvironment } from '../environments.js';
import {
	RESOLVED_VIRTUAL_GET_IMAGE_ID,
	RESOLVED_VIRTUAL_IMAGE_STYLES_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	VALID_INPUT_FORMATS,
	VIRTUAL_GET_IMAGE_ID,
	VIRTUAL_IMAGE_STYLES_ID,
	VIRTUAL_MODULE_ID,
	VIRTUAL_SERVICE_ID,
} from './consts.js';
import { RUNTIME_VIRTUAL_MODULE_ID } from './fonts/constants.js';
import { fontsPlugin } from './fonts/vite-plugin-fonts.js';
import { getAssetsPrefix } from './utils/getAssetsPrefix.js';
import { isESMImportedImage } from './utils/index.js';
import { emitClientAsset } from './utils/assets.js';
import { hashTransform, propsToFilename } from './utils/hash.js';
import { emitImageMetadata } from './utils/node.js';
import { CONTENT_IMAGE_FLAG } from '../content/consts.js';
import { getProxyCode } from './utils/proxy.js';
import { makeSvgComponent, parseSvgComponentData } from './svg/utils.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from './utils/url.js';
const assetRegex = new RegExp(`\\.(${VALID_INPUT_FORMATS.join('|')})`, 'i');
const assetRegexEnds = new RegExp(`\\.(${VALID_INPUT_FORMATS.join('|')})$`, 'i');
const addStaticImageFactory = (settings) => {
	return (options, hashProperties, originalFSPath) => {
		if (!globalThis.astroAsset.staticImages) {
			globalThis.astroAsset.staticImages = /* @__PURE__ */ new Map();
		}
		const ESMImportedImageSrc = isESMImportedImage(options.src) ? options.src.src : options.src;
		const fileExtension = extname(ESMImportedImageSrc);
		const assetPrefix = getAssetsPrefix(fileExtension, settings.config.build.assetsPrefix);
		const finalOriginalPath = removeBase(
			removeBase(ESMImportedImageSrc, settings.config.base),
			assetPrefix,
		);
		const hash = hashTransform(options, settings.config.image.service.entrypoint, hashProperties);
		let finalFilePath;
		let transformsForPath = globalThis.astroAsset.staticImages.get(finalOriginalPath);
		const transformForHash = transformsForPath?.transforms.get(hash);
		if (transformsForPath && transformForHash) {
			finalFilePath = transformForHash.finalPath;
		} else {
			finalFilePath = prependForwardSlash(
				joinPaths(
					isESMImportedImage(options.src) ? '' : settings.config.build.assets,
					prependForwardSlash(propsToFilename(finalOriginalPath, options, hash)),
				),
			);
			if (!transformsForPath) {
				globalThis.astroAsset.staticImages.set(finalOriginalPath, {
					originalSrcPath: originalFSPath,
					transforms: /* @__PURE__ */ new Map(),
				});
				transformsForPath = globalThis.astroAsset.staticImages.get(finalOriginalPath);
			}
			transformsForPath.transforms.set(hash, {
				finalPath: finalFilePath,
				transform: options,
			});
		}
		const url = createPlaceholderURL(
			settings.config.build.assetsPrefix
				? encodeURI(joinPaths(assetPrefix, finalFilePath))
				: encodeURI(prependForwardSlash(joinPaths(settings.config.base, finalFilePath))),
		);
		const assetQueryParams = settings.adapter?.client?.assetQueryParams;
		if (assetQueryParams) {
			assetQueryParams.forEach((value, key) => {
				url.searchParams.set(key, value);
			});
		}
		return stringifyPlaceholderURL(url);
	};
};
function assets({ fs, settings, sync, logger }) {
	let resolvedConfig;
	let shouldEmitFile = false;
	let isBuild = false;
	globalThis.astroAsset = {
		referencedImages: /* @__PURE__ */ new Set(),
	};
	const imageComponentPrefix = settings.config.image.responsiveStyles ? 'Responsive' : '';
	return [
		// Expose the components and different utilities from `astro:assets`
		{
			name: 'astro:assets',
			config(_, env) {
				isBuild = env.command === 'build';
			},
			resolveId: {
				filter: {
					id: new RegExp(`^(${VIRTUAL_SERVICE_ID}|${VIRTUAL_MODULE_ID}|${VIRTUAL_GET_IMAGE_ID})$`),
				},
				async handler(id) {
					if (id === VIRTUAL_SERVICE_ID) {
						if (isAstroServerEnvironment(this.environment)) {
							return await this.resolve(settings.config.image.service.entrypoint);
						}
						return await this.resolve('astro/assets/services/noop');
					}
					if (id === VIRTUAL_MODULE_ID) {
						return RESOLVED_VIRTUAL_MODULE_ID;
					}
					if (id === VIRTUAL_GET_IMAGE_ID) {
						return RESOLVED_VIRTUAL_GET_IMAGE_ID;
					}
				},
			},
			load: {
				filter: {
					id: new RegExp(`^(${RESOLVED_VIRTUAL_MODULE_ID}|${RESOLVED_VIRTUAL_GET_IMAGE_ID})$`),
				},
				handler(id) {
					if (id === RESOLVED_VIRTUAL_GET_IMAGE_ID) {
						const isServerEnvironment2 = isAstroServerEnvironment(this.environment);
						const getImageExport2 = isServerEnvironment2
							? `import { getImage as getImageInternal } from "astro/assets";
								export const getImage = async (options) => await getImageInternal(options, imageConfig);`
							: `import { AstroError, AstroErrorData } from "astro/errors";
								export const getImage = async () => {
									throw new AstroError(
										AstroErrorData.GetImageNotUsedOnServer.message,
										AstroErrorData.GetImageNotUsedOnServer.hint,
									);
								};`;
						const assetQueryParams = settings.adapter?.client?.assetQueryParams
							? `new URLSearchParams(${JSON.stringify(
									Array.from(settings.adapter.client.assetQueryParams.entries()),
								)})`
							: 'undefined';
						return {
							code: `
								export const imageConfig = ${JSON.stringify(settings.config.image)};
								Object.defineProperty(imageConfig, 'assetQueryParams', {
									value: ${assetQueryParams},
									enumerable: false,
									configurable: true,
								});
								${getImageExport2}
							`,
						};
					}
					const isServerEnvironment = isAstroServerEnvironment(this.environment);
					const getImageExport = isServerEnvironment
						? `import { getImage as getImageInternal } from "astro/assets";
							export const getImage = async (options) => await getImageInternal(options, imageConfig);`
						: `import { AstroError, AstroErrorData } from "astro/errors";
							export const getImage = async () => {
								throw new AstroError(
									AstroErrorData.GetImageNotUsedOnServer.message,
									AstroErrorData.GetImageNotUsedOnServer.hint,
								);
							};`;
					return {
						code: `
				import { getConfiguredImageService as _getConfiguredImageService } from "astro/assets";
				export { isLocalService } from "astro/assets";
				${settings.config.image.responsiveStyles ? `import "${VIRTUAL_IMAGE_STYLES_ID}";` : ''}
					export { default as Image } from "astro/components/${imageComponentPrefix}Image.astro";
					export { default as Picture } from "astro/components/${imageComponentPrefix}Picture.astro";
					import { inferRemoteSize as inferRemoteSizeInternal } from "astro/assets/utils/inferRemoteSize.js";

					export { default as Font } from "astro/components/Font.astro";
					export * from "${RUNTIME_VIRTUAL_MODULE_ID}";

					export const getConfiguredImageService = _getConfiguredImageService;

					export const viteFSConfig = ${JSON.stringify(resolvedConfig.server.fs ?? {})};

					export const safeModulePaths = new Set(${JSON.stringify(
						// @ts-expect-error safeModulePaths is internal to Vite
						Array.from(resolvedConfig.safeModulePaths ?? []),
					)});

					export const fsDenyGlob = ${serializeFsDenyGlob(resolvedConfig.server.fs?.deny ?? [])};

					const assetQueryParams = ${
						settings.adapter?.client?.assetQueryParams
							? `new URLSearchParams(${JSON.stringify(
									Array.from(settings.adapter.client.assetQueryParams.entries()),
								)})`
							: 'undefined'
					};
					export const imageConfig = ${JSON.stringify(settings.config.image)};
					Object.defineProperty(imageConfig, 'assetQueryParams', {
						value: assetQueryParams,
						enumerable: false,
						configurable: true,
					});
					export const inferRemoteSize = async (url) => {
						const service = await _getConfiguredImageService();
						return service.getRemoteSize?.(url, imageConfig) ?? inferRemoteSizeInternal(url, imageConfig);
					}
					// This is used by the @astrojs/node integration to locate images.
					// It's unused on other platforms, but on some platforms like Netlify (and presumably also Vercel)
					// new URL("dist/...") is interpreted by the bundler as a signal to include that directory
					// in the Lambda bundle, which would bloat the bundle with images.
					// To prevent this, we mark the URL construction as pure,
					// so that it's tree-shaken away for all platforms that don't need it.
					export const outDir = /* #__PURE__ */ new URL(${JSON.stringify(
						new URL(
							settings.buildOutput === 'server'
								? settings.config.build.client
								: settings.config.outDir,
						),
					)});
					export const serverDir = /* #__PURE__ */ new URL(${JSON.stringify(
						new URL(settings.config.build.server),
					)});
					${getImageExport}
				`,
					};
				},
			},
			buildStart() {
				if (!isBuild) return;
				globalThis.astroAsset.addStaticImage = addStaticImageFactory(settings);
			},
			// In build, rewrite paths to ESM imported images in code to their final location
			async renderChunk(code) {
				const assetUrlRE = /__ASTRO_ASSET_IMAGE__([\w$]+)__(?:_(.*?)__)?/g;
				let match;
				let s;
				while ((match = assetUrlRE.exec(code))) {
					s = s || (s = new MagicString(code));
					const [full, hash, postfix = ''] = match;
					const file = this.getFileName(hash);
					const fileExtension = extname(file);
					const pf = getAssetsPrefix(fileExtension, settings.config.build.assetsPrefix);
					const prefix = pf ? appendForwardSlash(pf) : resolvedConfig.base;
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
			config(_, env) {
				shouldEmitFile = env.command === 'build';
			},
			configResolved(viteConfig) {
				resolvedConfig = viteConfig;
			},
			load: {
				filter: {
					id: assetRegex,
				},
				async handler(id) {
					if (!globalThis.astroAsset.referencedImages)
						globalThis.astroAsset.referencedImages = /* @__PURE__ */ new Set();
					const isContentImage = id.includes(CONTENT_IMAGE_FLAG);
					if (isContentImage) {
						id = removeQueryString(id);
					}
					if (id !== removeQueryString(id)) {
						globalThis.astroAsset.referencedImages.add(removeQueryString(id));
						return;
					}
					if (!assetRegexEnds.test(id)) {
						return;
					}
					const fileEmitter = shouldEmitFile ? (opts) => emitClientAsset(this, opts) : void 0;
					const imageMetadata = await emitImageMetadata(id, fileEmitter);
					if (!imageMetadata) {
						throw new AstroError({
							...AstroErrorData.ImageNotFound,
							message: AstroErrorData.ImageNotFound.message(id),
						});
					}
					if (isAstroServerEnvironment(this.environment)) {
						if (id.endsWith('.svg') && !isContentImage) {
							const contents = await fs.promises.readFile(imageMetadata.fsPath, {
								encoding: 'utf8',
							});
							return {
								code: await makeSvgComponent(
									imageMetadata,
									contents,
									settings.config.experimental.svgOptimizer,
								),
							};
						}
						const isSSROnlyEnvironment =
							settings.buildOutput === 'server' &&
							this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
						if (isSSROnlyEnvironment) {
							globalThis.astroAsset.referencedImages.add(imageMetadata.fsPath);
						}
						if (id.endsWith('.svg') && isContentImage) {
							const contents = await fs.promises.readFile(imageMetadata.fsPath, {
								encoding: 'utf8',
							});
							const svgData = await parseSvgComponentData(
								imageMetadata,
								contents,
								settings.config.experimental.svgOptimizer,
							);
							const metadataWithSvg = { ...imageMetadata, __svgData: svgData };
							return {
								code: `export default ${getProxyCode(metadataWithSvg, isSSROnlyEnvironment)}`,
							};
						}
						return {
							code: `export default ${getProxyCode(imageMetadata, isSSROnlyEnvironment)}`,
						};
					} else {
						globalThis.astroAsset.referencedImages.add(imageMetadata.fsPath);
						return {
							code: `export default ${JSON.stringify(imageMetadata)}`,
						};
					}
				},
			},
		},
		fontsPlugin({ settings, sync, logger }),
		{
			name: 'astro:image-styles',
			resolveId: {
				filter: {
					id: new RegExp(`^${VIRTUAL_IMAGE_STYLES_ID}$`),
				},
				handler(id) {
					if (id === VIRTUAL_IMAGE_STYLES_ID) {
						return RESOLVED_VIRTUAL_IMAGE_STYLES_ID;
					}
				},
			},
			load: {
				filter: {
					id: new RegExp(`^${RESOLVED_VIRTUAL_IMAGE_STYLES_ID}$`),
				},
				async handler(id) {
					if (id === RESOLVED_VIRTUAL_IMAGE_STYLES_ID) {
						const { generateImageStylesCSS } = await import('./utils/generateImageStylesCSS.js');
						const css = generateImageStylesCSS(
							settings.config.image.objectFit,
							settings.config.image.objectPosition,
						);
						return { code: css };
					}
				},
			},
		},
	];
}
function serializeFsDenyGlob(denyPatterns) {
	const expandedPatterns = denyPatterns.map((pattern) =>
		pattern.includes('/') ? pattern : `**/${pattern}`,
	);
	const regexes = expandedPatterns.map((pattern) =>
		picomatch.makeRe(pattern, {
			matchBase: false,
			nocase: true,
			dot: true,
		}),
	);
	const serializedRegexes = regexes.map((re) => re.toString()).join(', ');
	return `(function() {
		const regexes = [${serializedRegexes}];
		return function fsDenyGlob(testPath) {
			return regexes.some(re => re.test(testPath));
		};
	})()`;
}
export { assets as default };
