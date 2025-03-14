import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import type { ResolveMod } from './providers/utils.js';
import type { PreloadData } from './types.js';
import xxhash from 'xxhash-wasm';
import { isAbsolute } from 'node:path';
import { getClientOutputDirectory } from '../../prerender/utils.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cache, createLogManager, extractFontType, kebab } from './utils.js';
import {
	VIRTUAL_MODULE_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	URL_PREFIX,
	CACHE_DIR,
} from './constants.js';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { Logger } from '../../core/logger/core.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { createViteLoader } from '../../core/module-loader/vite.js';
import { LocalFontsWatcher } from './providers/local.js';
import { readFile } from 'node:fs/promises';
import { createStorage, type Storage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
import { fileURLToPath } from 'node:url';
import { loadFonts } from './load.js';
import { generateFallbackFontFace, getMetricsForFamily, readMetrics } from './metrics.js';

interface Options {
	settings: AstroSettings;
	sync: boolean;
	logger: Logger;
}

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
	let storage: Storage | null = null;

	const cleanup = () => {
		resolvedMap = null;
		hashToUrlMap = null;
		storage = null;
	};

	async function initialize({ resolveMod, base }: { resolveMod: ResolveMod; base: URL }) {
		const { h64ToString } = await xxhash();

		storage = createStorage({
			// Types are weirly exported
			driver: (fsLiteDriver as unknown as typeof fsLiteDriver.default)({
				base: fileURLToPath(base),
			}),
		});

		// We initialize shared variables here and reset them in buildEnd
		// to avoid locking memory
		hashToUrlMap = new Map();
		resolvedMap = new Map();

		await loadFonts({
			root: settings.config.root,
			base: baseUrl,
			providers: settings.config.experimental.fonts!.providers ?? [],
			// TS is not smart enough
			families: settings.config.experimental.fonts!.families as any,
			storage,
			hashToUrlMap,
			resolvedMap,
			resolveMod,
			hashString: h64ToString,
			generateFallbackFontFace,
			getMetricsForFamily: async (name, font) => {
				let metrics = await getMetricsForFamily(name);
				if (font && !metrics) {
					const { data } = await cache(storage!, font.hash, () => fetchFont(font.url));
					metrics = await readMetrics(name, data);
				}
				return metrics;
			},
			log: (message) => logger.info('assets', message),
			generateCSSVariableName: (name) => kebab(name),
		});
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
				// Storage should be defined at this point since initialize it called before registering
				// the middleware. hashToUrlMap is defined at the same time so if it's not set by now,
				// no url will be matched and this line will not be reached.
				const { cached, data } = await cache(storage!, hash, () => fetchFont(url));
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
			if (sync || settings.config.experimental.fonts!.families.length === 0) {
				cleanup();
				return;
			}

			try {
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
							const { cached, data } = await cache(storage!, hash, () => fetchFont(url));
							logManager.remove(hash, cached);
							try {
								writeFileSync(new URL(hash, fontsDir), data);
							} catch (e) {
								throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: e });
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
