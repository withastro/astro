import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { collectErrorMetadata } from '../../core/errors/dev/utils.js';
import { AstroError, AstroErrorData, isAstroError } from '../../core/errors/index.js';
import type { Logger } from '../../core/logger/core.js';
import { formatErrorMessage } from '../../core/messages.js';
import { appendForwardSlash, joinPaths, prependForwardSlash } from '../../core/path.js';
import { getClientOutputDirectory } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import {
	ASSETS_DIR,
	CACHE_DIR,
	DEFAULTS,
	RESOLVED_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './constants.js';
import type {
	CssRenderer,
	FontFetcher,
	FontTypeExtractor,
	RemoteFontProviderModResolver,
	UrlResolver,
} from './definitions.js';
import { createMinifiableCssRenderer } from './implementations/css-renderer.js';
import { createDataCollector } from './implementations/data-collector.js';
import { createAstroErrorHandler } from './implementations/error-handler.js';
import { createCachedFontFetcher } from './implementations/font-fetcher.js';
import { createFontaceFontFileReader } from './implementations/font-file-reader.js';
import { createCapsizeFontMetricsResolver } from './implementations/font-metrics-resolver.js';
import { createFontTypeExtractor } from './implementations/font-type-extractor.js';
import { createXxHasher } from './implementations/hasher.js';
import { createRequireLocalProviderUrlResolver } from './implementations/local-provider-url-resolver.js';
import {
	createBuildRemoteFontProviderModResolver,
	createDevServerRemoteFontProviderModResolver,
} from './implementations/remote-font-provider-mod-resolver.js';
import { createRemoteFontProviderResolver } from './implementations/remote-font-provider-resolver.js';
import { createFsStorage } from './implementations/storage.js';
import { createSystemFallbacksProvider } from './implementations/system-fallbacks-provider.js';
import { createUrlProxy } from './implementations/url-proxy.js';
import {
	createLocalUrlProxyContentResolver,
	createRemoteUrlProxyContentResolver,
} from './implementations/url-proxy-content-resolver.js';
import { createBuildUrlResolver, createDevUrlResolver } from './implementations/url-resolver.js';
import { orchestrate } from './orchestrate.js';
import type { ConsumableMap, FontFileDataMap } from './types.js';

interface Options {
	settings: AstroSettings;
	sync: boolean;
	logger: Logger;
}

export function fontsPlugin({ settings, sync, logger }: Options): Plugin {
	if (!settings.config.experimental.fonts) {
		// This is required because the virtual module may be imported as
		// a side effect
		// TODO: remove once fonts are stabilized
		return {
			name: 'astro:fonts:fallback',
			resolveId(id) {
				if (id === VIRTUAL_MODULE_ID) {
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
			},
			load(id) {
				if (id === RESOLVED_VIRTUAL_MODULE_ID) {
					return {
						code: '',
					};
				}
			},
		};
	}

	// We don't need to worry about config.trailingSlash because we are dealing with
	// static assets only, ie. trailingSlash: 'never'
	const assetsDir = prependForwardSlash(
		appendForwardSlash(joinPaths(settings.config.build.assets, ASSETS_DIR)),
	);
	const baseUrl = joinPaths(settings.config.base, assetsDir);

	let fontFileDataMap: FontFileDataMap | null = null;
	let consumableMap: ConsumableMap | null = null;
	let isBuild: boolean;
	let fontFetcher: FontFetcher | null = null;
	let fontTypeExtractor: FontTypeExtractor | null = null;

	const cleanup = () => {
		consumableMap = null;
		fontFileDataMap = null;
		fontFetcher = null;
	};

	async function initialize({
		cacheDir,
		modResolver,
		cssRenderer,
		urlResolver,
	}: {
		cacheDir: URL;
		modResolver: RemoteFontProviderModResolver;
		cssRenderer: CssRenderer;
		urlResolver: UrlResolver;
	}) {
		const { root } = settings.config;
		// Dependencies. Once extracted to a dedicated vite plugin, those may be passed as
		// a Vite plugin option.
		const hasher = await createXxHasher();
		const errorHandler = createAstroErrorHandler();
		const remoteFontProviderResolver = createRemoteFontProviderResolver({
			root,
			modResolver,
			errorHandler,
		});
		// TODO: remove when stabilizing
		const pathsToWarn = new Set<string>();
		const localProviderUrlResolver = createRequireLocalProviderUrlResolver({
			root,
			intercept: (path) => {
				if (path.startsWith(fileURLToPath(settings.config.publicDir))) {
					if (pathsToWarn.has(path)) {
						return;
					}
					pathsToWarn.add(path);
					logger.warn(
						'assets',
						`Found a local font file ${JSON.stringify(path)} in the \`public/\` folder. To avoid duplicated files in the build output, move this file into \`src/\``,
					);
				}
			},
		});
		const storage = createFsStorage({ base: cacheDir });
		const systemFallbacksProvider = createSystemFallbacksProvider();
		fontFetcher = createCachedFontFetcher({ storage, errorHandler, fetch, readFile });
		const fontMetricsResolver = createCapsizeFontMetricsResolver({ fontFetcher, cssRenderer });
		fontTypeExtractor = createFontTypeExtractor({ errorHandler });
		const fontFileReader = createFontaceFontFileReader({ errorHandler });

		const res = await orchestrate({
			families: settings.config.experimental.fonts!,
			hasher,
			remoteFontProviderResolver,
			localProviderUrlResolver,
			storage,
			cssRenderer,
			systemFallbacksProvider,
			fontMetricsResolver,
			fontTypeExtractor,
			fontFileReader,
			logger,
			createUrlProxy: ({ local, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = local
					? createLocalUrlProxyContentResolver({ errorHandler })
					: createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver,
					contentResolver,
					hasher,
					dataCollector,
				});
			},
			defaults: DEFAULTS,
		});
		// We initialize shared variables here and reset them in buildEnd
		// to avoid locking memory
		fontFileDataMap = res.fontFileDataMap;
		consumableMap = res.consumableMap;
	}

	return {
		name: 'astro:fonts',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		async buildStart() {
			if (isBuild) {
				await initialize({
					cacheDir: new URL(CACHE_DIR, settings.config.cacheDir),
					modResolver: createBuildRemoteFontProviderModResolver(),
					cssRenderer: createMinifiableCssRenderer({ minify: true }),
					urlResolver: createBuildUrlResolver({
						base: baseUrl,
						assetsPrefix: settings.config.build.assetsPrefix,
					}),
				});
			}
		},
		async configureServer(server) {
			await initialize({
				// In dev, we cache fonts data in .astro so it can be easily inspected and cleared
				cacheDir: new URL(CACHE_DIR, settings.dotAstroDir),
				modResolver: createDevServerRemoteFontProviderModResolver({ server }),
				cssRenderer: createMinifiableCssRenderer({ minify: false }),
				urlResolver: createDevUrlResolver({ base: baseUrl }),
			});
			// The map is always defined at this point. Its values contains urls from remote providers
			// as well as local paths for the local provider. We filter them to only keep the filepaths
			const localPaths = [...fontFileDataMap!.values()]
				.filter(({ url }) => isAbsolute(url))
				.map((v) => v.url);
			server.watcher.on('change', (path) => {
				if (localPaths.includes(path)) {
					logger.info('assets', 'Font file updated');
					server.restart();
				}
			});
			// We do not purge the cache in case the user wants to re-use the file later on
			server.watcher.on('unlink', (path) => {
				if (localPaths.includes(path)) {
					logger.warn(
						'assets',
						`The font file ${JSON.stringify(path)} referenced in your config has been deleted. Restore the file or remove this font from your configuration if it is no longer needed.`,
					);
				}
			});

			server.middlewares.use(assetsDir, async (req, res, next) => {
				if (!req.url) {
					return next();
				}
				const hash = req.url.slice(1);
				const associatedData = fontFileDataMap?.get(hash);
				if (!associatedData) {
					return next();
				}
				// We don't want the request to be cached in dev because we cache it already internally,
				// and it makes it easier to debug without needing hard refreshes
				res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
				res.setHeader('Pragma', 'no-cache');
				res.setHeader('Expires', 0);

				try {
					// Storage should be defined at this point since initialize it called before registering
					// the middleware. hashToUrlMap is defined at the same time so if it's not set by now,
					// no url will be matched and this line will not be reached.
					const data = await fontFetcher!.fetch({ hash, ...associatedData });

					res.setHeader('Content-Length', data.length);
					res.setHeader('Content-Type', `font/${fontTypeExtractor!.extract(hash)}`);

					res.end(data);
				} catch (err) {
					logger.error('assets', 'Cannot download font file');
					if (isAstroError(err)) {
						logger.error(
							'SKIP_FORMAT',
							formatErrorMessage(collectErrorMetadata(err), logger.level() === 'debug'),
						);
					}
					res.statusCode = 500;
					res.end();
				}
			});
		},
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return {
					code: `export const fontsData = new Map(${JSON.stringify(Array.from(consumableMap?.entries() ?? []))})`,
				};
			}
		},
		async buildEnd() {
			if (sync || settings.config.experimental.fonts!.length === 0) {
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
				if (fontFileDataMap) {
					logger.info('assets', 'Copying fonts...');
					await Promise.all(
						Array.from(fontFileDataMap.entries()).map(async ([hash, associatedData]) => {
							const data = await fontFetcher!.fetch({ hash, ...associatedData });
							try {
								writeFileSync(new URL(hash, fontsDir), data);
							} catch (cause) {
								throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
							}
						}),
					);
				}
			} finally {
				cleanup();
			}
		},
	};
}
