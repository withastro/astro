import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { isAbsolute } from 'node:path';
import colors from 'piccolore';
import type { Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../core/constants.js';
import { getAlgorithm, shouldTrackCspHashes } from '../../core/csp/common.js';
import { generateCspDigest } from '../../core/encryption.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { AstroLogger } from '../../core/logger/core.js';
import { appendForwardSlash, joinPaths, prependForwardSlash } from '../../core/path.js';
import { getClientOutputDirectory } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import {
	ASSETS_DIR,
	CACHE_DIR,
	DEFAULTS,
	RESOLVED_RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID,
	RESOLVED_RUNTIME_VIRTUAL_MODULE_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID,
	RUNTIME_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './constants.js';
import { collectComponentData } from './core/collect-component-data.js';
import { collectFontAssetsFromFaces } from './core/collect-font-assets-from-faces.js';
import { collectFontData } from './core/collect-font-data.js';
import { computeFontFamiliesAssets } from './core/compute-font-families-assets.js';
import { filterAndTransformFontFaces } from './core/filter-and-transform-font-faces.js';
import { getOrCreateFontFamilyAssets } from './core/get-or-create-font-family-assets.js';
import { optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamily } from './core/resolve-family.js';
import type { FontFetcher, FontTypeExtractor } from './definitions.js';
import { BuildFontFileIdGenerator } from './infra/build-font-file-id-generator.js';
import { BuildUrlResolver } from './infra/build-url-resolver.js';
import { CachedFontFetcher } from './infra/cached-font-fetcher.js';
import { CapsizeFontMetricsResolver } from './infra/capsize-font-metrics-resolver.js';
import { DevFontFileIdGenerator } from './infra/dev-font-file-id-generator.js';
import { DevUrlResolver } from './infra/dev-url-resolver.js';
import { FsFontFileContentResolver } from './infra/fs-font-file-content-resolver.js';
import { LevenshteinStringMatcher } from './infra/levenshtein-string-matcher.js';
import { MinifiableCssRenderer } from './infra/minifiable-css-renderer.js';
import { NodeFontTypeExtractor } from './infra/node-font-type-extractor.js';
import { RealSystemFallbacksProvider } from './infra/system-fallbacks-provider.js';
import { UnifontFontResolver } from './infra/unifont-font-resolver.js';
import { UnstorageFsStorage } from './infra/unstorage-fs-storage.js';
import { XxhashHasher } from './infra/xxhash-hasher.js';
import type {
	ComponentDataByCssVariable,
	FontDataByCssVariable,
	FontFamily,
	FontFileById,
} from './types.js';
import { fontFileMiddleware, resToMinimalResponse } from './core/font-file-middleware.js';

interface Options {
	settings: AstroSettings;
	sync: boolean;
	logger: AstroLogger;
}

export function fontsPlugin({ settings, sync, logger }: Options): Plugin {
	// We don't need to worry about config.trailingSlash because we are dealing with
	// static assets only, ie. trailingSlash: 'never'
	const assetsDir = prependForwardSlash(
		appendForwardSlash(joinPaths(settings.config.build.assets, ASSETS_DIR)),
	);
	const baseUrl = joinPaths(settings.config.base, assetsDir);

	// We initialize shared variables here and reset them in buildEnd
	// to avoid locking memory
	let fontFileById: FontFileById | null = null;
	let componentDataByCssVariable: ComponentDataByCssVariable | null = null;
	let fontDataByCssVariable: FontDataByCssVariable | null = null;

	let fontFetcher: FontFetcher | null = null;
	let fontTypeExtractor: FontTypeExtractor | null = null;
	let built = false;
	let serverAddress: AddressInfo | null = null;
	let urls: Array<string> | null = null;

	function cleanup() {
		componentDataByCssVariable = null;
		fontDataByCssVariable = null;
		fontFileById = null;
		fontFetcher = null;
		serverAddress = null;
		urls = null;
	}

	return {
		name: 'astro:fonts',
		async buildStart() {
			if (sync) {
				return;
			}
			const { root } = settings.config;
			const isBuild = this.environment.config.command === 'build';
			// Dependencies. Once extracted to a dedicated vite plugin, those may be passed as
			// a Vite plugin option.
			const hasher = await XxhashHasher.create();
			const storage = new UnstorageFsStorage({
				// In dev, we cache fonts data in .astro so it can be easily inspected and cleared
				base: new URL(CACHE_DIR, isBuild ? settings.config.cacheDir : settings.dotAstroDir),
			});
			const systemFallbacksProvider = new RealSystemFallbacksProvider();
			fontFetcher = new CachedFontFetcher({ storage, fetch, readFile });
			const cssRenderer = new MinifiableCssRenderer({ minify: isBuild });
			const fontMetricsResolver = new CapsizeFontMetricsResolver({ fontFetcher, cssRenderer });
			fontTypeExtractor = new NodeFontTypeExtractor();
			const stringMatcher = new LevenshteinStringMatcher();
			const urlResolver = isBuild
				? new BuildUrlResolver({
						base: baseUrl,
						assetsPrefix: settings.config.build.assetsPrefix,
						searchParams: settings.adapter?.client?.assetQueryParams ?? new URLSearchParams(),
					})
				: new DevUrlResolver({
						base: baseUrl,
						searchParams: settings.adapter?.client?.assetQueryParams ?? new URLSearchParams(),
					});
			const contentResolver = new FsFontFileContentResolver({
				readFileSync: (path) => readFileSync(path, 'utf-8'),
			});
			const fontFileIdGenerator = isBuild
				? new BuildFontFileIdGenerator({
						hasher,
						contentResolver,
					})
				: new DevFontFileIdGenerator({
						hasher,
						contentResolver,
					});
			const { bold } = colors;
			const defaults = DEFAULTS;
			const resolvedFamilies =
				settings.config.fonts?.map((family) =>
					resolveFamily({ family: family as FontFamily, hasher }),
				) ?? [];
			const { fontFamilyAssets, fontFileById: _fontFileById } = await computeFontFamiliesAssets({
				resolvedFamilies,
				defaults,
				bold,
				logger,
				stringMatcher,
				fontResolver: await UnifontFontResolver.create({
					families: resolvedFamilies,
					hasher,
					storage,
					root,
				}),
				getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) =>
					getOrCreateFontFamilyAssets({
						family,
						fontFamilyAssetsByUniqueKey,
						bold,
						logger,
					}),
				filterAndTransformFontFaces: ({ family, fonts }) =>
					filterAndTransformFontFaces({
						family,
						fonts,
						fontFileIdGenerator,
						fontTypeExtractor: fontTypeExtractor!,
						urlResolver,
					}),
				collectFontAssetsFromFaces: ({ collectedFontsIds, family, fontFilesIds, fonts }) =>
					collectFontAssetsFromFaces({
						collectedFontsIds,
						family,
						fontFilesIds,
						fonts,
						fontFileIdGenerator,
						hasher,
						defaults,
					}),
			});
			fontDataByCssVariable = collectFontData(fontFamilyAssets);
			componentDataByCssVariable = await collectComponentData({
				cssRenderer,
				defaults,
				fontFamilyAssets,
				optimizeFallbacks: ({ collectedFonts, fallbacks, family }) =>
					optimizeFallbacks({
						collectedFonts,
						fallbacks,
						family,
						fontMetricsResolver,
						systemFallbacksProvider,
					}),
			});
			fontFileById = _fontFileById;

			if (shouldTrackCspHashes(settings.config.security.csp)) {
				// Handle CSP
				const algorithm = getAlgorithm(settings.config.security.csp);

				// Generate a hash for each style we generate
				for (const { css } of componentDataByCssVariable.values()) {
					settings.injectedCsp.styleHashes.push(await generateCspDigest(css, algorithm));
				}
				for (const resource of urlResolver.cspResources) {
					settings.injectedCsp.fontResources.add(resource);
				}
			}

			urls = urlResolver.urls;

			if (
				this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender &&
				fontFileById.size > 0
			) {
				settings.fontsHttpServer = await new Promise<Server>((r) => {
					const server = createServer((req, res) => {
						const next = () => {
							if (!res.writableEnded) {
								res.writeHead(404);
								res.end();
							}
						};
						if (req.url?.startsWith(baseUrl)) {
							return fontFileMiddleware({
								url: req.url.slice(baseUrl.length - 1),
								response: resToMinimalResponse(res),
								next,
								fontFetcher,
								fontFileById,
								fontTypeExtractor,
								logger,
							});
						}
						return next();
					}).listen(() => {
						r(server);
					});
				});
				serverAddress = settings.fontsHttpServer.address() as AddressInfo;
			}
		},
		async configureServer(server) {
			server.httpServer?.on('listening', () => {
				serverAddress = server.httpServer?.address() as AddressInfo;
			});

			server.watcher.on('change', (path) => {
				if (!fontFileById) {
					return;
				}
				const localPaths = [...fontFileById.values()]
					.filter(({ url }) => isAbsolute(url))
					.map((v) => v.url);
				if (localPaths.includes(path)) {
					logger.info('assets', 'Font file updated');
					server.restart();
				}
			});
			// We do not purge the cache in case the user wants to re-use the file later on
			server.watcher.on('unlink', (path) => {
				if (!fontFileById) {
					return;
				}
				const localPaths = [...fontFileById.values()]
					.filter(({ url }) => isAbsolute(url))
					.map((v) => v.url);
				if (localPaths.includes(path)) {
					logger.warn(
						'assets',
						`The font file ${JSON.stringify(path)} referenced in your config has been deleted. Restore the file or remove this font from your configuration if it is no longer needed.`,
					);
				}
			});

			server.middlewares.use(assetsDir, (req, res, next) =>
				fontFileMiddleware({
					url: req.url,
					response: resToMinimalResponse(res),
					next,
					fontFetcher,
					fontFileById,
					fontTypeExtractor,
					logger,
				}),
			);
		},
		resolveId: {
			filter: {
				id: new RegExp(
					`^(${VIRTUAL_MODULE_ID}|${RUNTIME_VIRTUAL_MODULE_ID}|${RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID})$`,
				),
			},
			handler(id) {
				if (id === VIRTUAL_MODULE_ID) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				if (id === RUNTIME_VIRTUAL_MODULE_ID) {
					return RESOLVED_RUNTIME_VIRTUAL_MODULE_ID;
				}
				if (id === RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID) {
					return RESOLVED_RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(
					`^(${RESOLVED_VIRTUAL_MODULE_ID}|${RESOLVED_RUNTIME_VIRTUAL_MODULE_ID}|${RESOLVED_RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID})$`,
				),
			},
			async handler(id) {
				if (id === RESOLVED_VIRTUAL_MODULE_ID) {
					return {
						code: `
						export const componentDataByCssVariable = new Map(${JSON.stringify(Array.from(componentDataByCssVariable?.entries() ?? []))});
						export const fontDataByCssVariable = ${JSON.stringify(fontDataByCssVariable ?? {})}
					`,
					};
				}

				if (id === RESOLVED_RUNTIME_VIRTUAL_MODULE_ID) {
					return {
						code: `export * from 'astro/assets/fonts/runtime.js';`,
					};
				}

				if (id === RESOLVED_RUNTIME_FONT_FILE_URL_RESOLVER_VIRTUAL_MODULE_ID) {
					const isPrerender = this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender;

					if (this.environment.config.command === 'build' && !isPrerender) {
						return {
							code: `
								import { SsrRuntimeFontFileUrlResolver } from ${JSON.stringify(new URL('./infra/ssr-runtime-font-file-url-resolver.js', import.meta.url))};
								export const runtimeFontFileUrlResolver = new SsrRuntimeFontFileUrlResolver({
									urls: new Set(${JSON.stringify(urls)}),
								});
							`,
						};
					}

					return {
						code: `
							import { RemoteRuntimeFontFileUrlResolver } from ${JSON.stringify(new URL('./infra/remote-runtime-font-file-url-resolver.js', import.meta.url))};
							export const runtimeFontFileUrlResolver = new RemoteRuntimeFontFileUrlResolver({
								urls: new Set(${JSON.stringify(urls)}),
								address: ${JSON.stringify(serverAddress)},
							});
						`,
					};
				}
			},
		},
		async buildEnd() {
			// Run once during the build, no matter how many environments there are
			if (built) {
				return;
			}
			if (sync || !settings.config.fonts?.length || this.environment.config.command === 'serve') {
				cleanup();
				return;
			}

			try {
				const dir = getClientOutputDirectory(settings);
				const fontsDir = new URL(`.${assetsDir}`, dir);
				try {
					mkdirSync(fontsDir, { recursive: true });
				} catch (cause) {
					throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
				}
				if (fontFileById) {
					logger.info(
						'assets',
						`Copying fonts (${fontFileById.size} file${fontFileById.size === 1 ? '' : 's'})...`,
					);
					await Promise.all(
						Array.from(fontFileById.entries()).map(async ([id, associatedData]) => {
							const data = await fontFetcher!.fetch({ id, ...associatedData });
							try {
								writeFileSync(new URL(id, fontsDir), data);
							} catch (cause) {
								throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
							}
						}),
					);
				}
			} finally {
				cleanup();
				built = true;
			}
		},
	};
}
