import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { resolveProviders, type ResolveMod } from './providers/utils.js';
import * as unifont from 'unifont';
import type { FontFamily, FontProvider, FontType } from './types.js';
import xxhash from 'xxhash-wasm';
import { isAbsolute } from 'node:path';
import { getClientOutputDirectory } from '../../prerender/utils.js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
	generateFontFace,
	createCache,
	type CacheHandler,
	proxyURL,
	extractFontType,
	type ProxyURLOptions,
	generateFallbacksCSS,
} from './utils.js';
import {
	DEFAULTS,
	VIRTUAL_MODULE_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	URL_PREFIX,
	CACHE_DIR,
} from './constants.js';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { Logger } from '../../core/logger/core.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { createViteLoader } from '../../core/module-loader/vite.js';
import { resolveLocalFont, LOCAL_PROVIDER_NAME, LocalFontsWatcher } from './providers/local.js';
import { readFile } from 'node:fs/promises';
import { createStorage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
import { fileURLToPath } from 'node:url';
import * as fontaine from 'fontaine';

interface Options {
	settings: AstroSettings;
	sync: boolean;
	logger: Logger;
}

/**
 * Preload data is used for links generation inside the <Font /> component
 */
type PreloadData = Array<{
	/**
	 * Absolute link to a font file, eg. /_astro/fonts/abc.woff
	 */
	url: string;
	/**
	 * A font type, eg. woff2, woff, ttf...
	 */
	type: FontType;
}>;

/**
 * We want to show logs related to font downloading (fresh or from cache)
 * However if we just use the logger as is, there are too many logs, and not
 * so useful.
 * This log manager allows avoiding repetitive logs:
 * - If there are many downloads started at once, only one log is shown for start and end
 * - If a given file has already been logged, it won't show up anymore (useful in dev)
 */
// TODO: test
const createLogManager = (logger: Logger) => {
	const done = new Set<string>();
	const items = new Set<string>();
	let id: NodeJS.Timeout | null = null;

	return {
		add: (value: string) => {
			if (done.has(value)) {
				return;
			}

			if (items.size === 0 && id === null) {
				logger.info('assets', 'Downloading fonts...');
			}
			items.add(value);
			if (id) {
				clearTimeout(id);
				id = null;
			}
		},
		remove: (value: string, cached: boolean) => {
			if (done.has(value)) {
				return;
			}

			items.delete(value);
			done.add(value);
			if (id) {
				clearTimeout(id);
				id = null;
			}
			id = setTimeout(() => {
				let msg = 'Done';
				if (cached) {
					msg += ' (loaded from cache)';
				}
				logger.info('assets', msg);
			}, 50);
		},
	};
};

async function fetchFont(url: string): Promise<Buffer> {
	try {
		if (isAbsolute(url)) {
			return await readFile(url);
		}
		const r = await fetch(url);
		const arr = await r.arrayBuffer();
		return Buffer.from(arr);
	} catch (e) {
		// TODO: AstroError
		throw new Error('Error downloading font file', { cause: e });
	}
}

export function fontsPlugin({ settings, sync, logger }: Options): Plugin {
	if (!settings.config.experimental.fonts) {
		// this is required because the virtual module does not exist
		// when fonts are not enabled, and that prevents rollup from building
		// TODO: remove once fonts are stabilized
		return {
			name: 'astro:fonts:fallback',
			config() {
				return {
					build: {
						rollupOptions: {
							external: [VIRTUAL_MODULE_ID],
						},
					},
				};
			},
		};
	}

	const providers: Array<FontProvider<string>> = settings.config.experimental.fonts.providers ?? [];
	const families: Array<FontFamily<'local' | 'custom'>> = settings.config.experimental.fonts
		.families as any;

	// We don't need to take the trailing slash and build output configuration options
	// into account because we only serve (dev) or write (build) static assets (equivalent
	// to trailingSlash: never)
	const baseUrl = removeTrailingForwardSlash(settings.config.base) + URL_PREFIX;

	let resolvedMap: Map<string, { preloadData: PreloadData; css: string }> | null = null;
	// Key is `${hash}.${ext}`, value is a URL.
	// When a font file is requested (eg. /_astro/fonts/abc.woff), we use the hash
	// to download the original file, or retrieve it from cache
	let hashToUrlMap: Map<string, string> | null = null;
	let isBuild: boolean;
	let cache: CacheHandler | null = null;

	// TODO: refactor to allow testing
	async function initialize({ resolveMod, base }: { resolveMod: ResolveMod; base: URL }) {
		const { h64ToString } = await xxhash();

		const resolved = await resolveProviders({
			root: settings.config.root,
			providers,
			resolveMod,
		});

		const storage = createStorage({
			driver: (fsLiteDriver as unknown as typeof fsLiteDriver.default)({
				base: fileURLToPath(base),
			}),
		});

		cache = createCache(storage);

		const { resolveFont } = await unifont.createUnifont(
			resolved.map((e) => e.provider(e.config)),
			{ storage },
		);

		// We initialize shared variables here and reset them in buildEnd
		// to avoid locking memory
		resolvedMap = new Map();
		hashToUrlMap = new Map();

		for (const family of families) {
			const preloadData: PreloadData = [];
			let css = '';

			// When going through the urls/filepaths returned by providers,
			// We save the hash and the associated original value so we can use
			// it in the vite middleware during development
			const collect: ProxyURLOptions['collect'] = ({ hash, type, value }) => {
				const url = baseUrl + hash;
				if (!hashToUrlMap!.has(hash)) {
					hashToUrlMap!.set(hash, value);
					preloadData.push({ url, type });
				}
				return url;
			};

			let fonts: Array<unifont.FontFaceData>;

			if (family.provider === LOCAL_PROVIDER_NAME) {
				const result = resolveLocalFont(family, {
					proxyURL: (value) => {
						return proxyURL({
							value,
							// We hash based on the filepath and the contents, since the user could replace
							// a given font file with completely different contents.
							hashString: (v) => {
								let content: string;
								try {
									content = readFileSync(value, 'utf-8');
								} catch (e) {
									throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: e });
								}
								return h64ToString(v + content);
							},
							collect,
						});
					},
					root: settings.config.root,
				});
				fonts = result.fonts;
			} else {
				const result = await resolveFont(
					family.name,
					// We do not merge the defaults, we only provide defaults as a fallback
					{
						weights: family.weights ?? DEFAULTS.weights,
						styles: family.styles ?? DEFAULTS.styles,
						subsets: family.subsets ?? DEFAULTS.subsets,
						// No default fallback to be used here
						fallbacks: family.fallbacks,
					},
					// By default, fontaine goes through all providers. We use a different approach
					// where we specify a provider per font (default to google)
					[family.provider],
				);

				for (const data of result.fonts) {
					for (const source of data.src) {
						if ('name' in source) {
							continue;
						}
						source.originalURL = source.url;
						source.url = proxyURL({
							value: source.url,
							// We only use the url for hashing since the service returns urls with a hash already
							hashString: h64ToString,
							collect,
						});
					}
				}

				fonts = result.fonts;
			}

			for (const data of fonts) {
				css += generateFontFace(family.name, data);
			}
			const urls = fonts
				.flatMap((font) => font.src.map((src) => ('originalURL' in src ? src.originalURL : null)))
				.filter(Boolean);

			const fallbackData = await generateFallbacksCSS({
				family: family.name,
				fallbacks: family.fallbacks ?? [],
				fontURL: urls.at(0) ?? null,
				getMetricsForFamily: async (name, fontURL) => {
					let metrics = await fontaine.getMetricsForFamily(name);
					if (fontURL && !metrics) {
						// TODO: investigate in using capsize directly (fromBlob) to be able to cache
						metrics = await fontaine.readMetrics(fontURL);
					}
					return metrics;
				},
				generateFontFace: fontaine.generateFontFace,
			});

			if (fallbackData) {
				css += fallbackData.css;
				// TODO: generate css var
			}

			resolvedMap.set(family.name, { preloadData, css });
		}
		logger.info('assets', 'Fonts initialized');
	}

	return {
		name: 'astro:fonts',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		async buildStart() {
			if (isBuild) {
				await initialize({
					resolveMod: (id) => import(id),
					base: new URL(CACHE_DIR, settings.config.cacheDir),
				});
			}
		},
		async configureServer(server) {
			const moduleLoader = createViteLoader(server);
			await initialize({
				resolveMod: (id) => moduleLoader.import(id),
				// In dev, we cache fonts data in .astro so it can be easily inspected and cleared
				base: new URL(CACHE_DIR, settings.dotAstroDir),
			});
			const localFontsWatcher = new LocalFontsWatcher({
				// The map is always defined at this point. Its values contains urls from remote providers
				// as well as local paths for the local provider. We filter them to only keep the filepaths
				paths: [...hashToUrlMap!.values()].filter((url) => isAbsolute(url)),
				// Whenever a local font file is updated, we restart the server so the user always has an up to date
				// version of the font file
				update: () => {
					logger.info('assets', 'Font file updated');
					server.restart();
				},
			});
			server.watcher.on('change', (path) => localFontsWatcher.onUpdate(path));
			// We do not purge the cache in case the user wants to re-use the file later on
			server.watcher.on('unlink', (path) => localFontsWatcher.onUnlink(path));

			const logManager = createLogManager(logger);
			// Base is taken into account by default. The prefix contains a traling slash,
			// so it matches correctly any hash, eg. /_astro/fonts/abc.woff => abc.woff
			server.middlewares.use(URL_PREFIX, async (req, res, next) => {
				if (!req.url) {
					return next();
				}
				const hash = req.url.slice(1);
				const url = hashToUrlMap?.get(hash);
				if (!url) {
					return next();
				}
				logManager.add(hash);
				// Cache should be defined at this point since initialize it called before registering
				// the middleware. hashToUrlMap is defined at the same time so if it's not set by now,
				// no url will be matched and this line will not be reached.
				const { cached, data } = await cache!(hash, () => fetchFont(url));
				logManager.remove(hash, cached);

				res.setHeader('Content-Length', data.length);
				res.setHeader('Content-Type', `font/${extractFontType(hash)}`);
				// We don't want the request to be cached in dev because we cache it already internally,
				// and it makes it easier to debug without needing hard refreshes
				res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
				res.setHeader('Pragma', 'no-cache');
				res.setHeader('Expires', 0);

				res.end(data);
			});
		},
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id, opts) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID && opts?.ssr) {
				return `
				export const fontsData = new Map(${JSON.stringify(Array.from(resolvedMap?.entries() ?? []))})
				`;
			}
		},
		async buildEnd() {
			resolvedMap = null;

			if (sync) {
				hashToUrlMap = null;
				cache = null;
				return;
			}

			// TODO: properly cleanup in case of failure

			const logManager = createLogManager(logger);
			const dir = getClientOutputDirectory(settings);
			const fontsDir = new URL('.' + baseUrl, dir);
			try {
				mkdirSync(fontsDir, { recursive: true });
			} catch (e) {
				throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: e });
			}
			if (hashToUrlMap) {
				await Promise.all(
					Array.from(hashToUrlMap.entries()).map(async ([hash, url]) => {
						logManager.add(hash);
						const { cached, data } = await cache!(hash, () => fetchFont(url));
						logManager.remove(hash, cached);
						try {
							writeFileSync(new URL(hash, fontsDir), data);
						} catch (e) {
							throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: e });
						}
					}),
				);
			}

			hashToUrlMap = null;
			cache = null;
		},
	};
}
