import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { type Storage, createStorage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
import type { Plugin } from 'vite';
import xxhash from 'xxhash-wasm';
import { collectErrorMetadata } from '../../core/errors/dev/utils.js';
import { AstroError, AstroErrorData, isAstroError } from '../../core/errors/index.js';
import type { Logger } from '../../core/logger/core.js';
import { formatErrorMessage } from '../../core/messages.js';
import { getClientOutputDirectory } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import {
	CACHE_DIR,
	RESOLVED_VIRTUAL_MODULE_ID,
	URL_PREFIX,
	VIRTUAL_MODULE_ID,
} from './constants.js';
import { loadFonts } from './load.js';
import { generateFallbackFontFace, readMetrics } from './metrics.js';
import type { ResolveMod } from './providers/utils.js';
import type { PreloadData, ResolvedFontFamily } from './types.js';
import {
	cache,
	extractFontType,
	resolveEntrypoint,
	resolveFontFamily,
	sortObjectByKey,
	withoutQuotes,
} from './utils.js';

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
		// TODO: find a way to pass headers
		// https://github.com/unjs/unifont/issues/143
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response was not successful, received status code ${response.status}`);
		}
		return Buffer.from(await response.arrayBuffer());
	} catch (cause) {
		throw new AstroError(
			{
				...AstroErrorData.CannotFetchFontFile,
				message: AstroErrorData.CannotFetchFontFile.message(url),
			},
			{ cause },
		);
	}
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

		const families: Array<ResolvedFontFamily> = [];

		const root = settings.config.root;
		const pathsToWarn = new Set<string>();

		for (const family of settings.config.experimental.fonts!) {
			families.push(
				await resolveFontFamily({
					family,
					root,
					resolveMod,
					generateNameWithHash: (_family) =>
						`${withoutQuotes(_family.name)}-${h64ToString(JSON.stringify(sortObjectByKey(_family)))}`,
					resolveLocalEntrypoint: (url) => {
						const resolvedPath = fileURLToPath(resolveEntrypoint(root, url));
						if (resolvedPath.startsWith(fileURLToPath(settings.config.publicDir))) {
							pathsToWarn.add(resolvedPath);
						}
						return resolvedPath;
					},
				}),
			);
		}

		for (const path of [...pathsToWarn]) {
			// TODO: remove when stabilizing
			logger.warn(
				'assets',
				`Found a local font file ${JSON.stringify(path)} in the \`public/\` folder. To avoid duplicated files in the build output, move this file into \`src/\``,
			);
		}

		await loadFonts({
			base: baseUrl,
			families,
			storage,
			hashToUrlMap,
			resolvedMap,
			hashString: h64ToString,
			generateFallbackFontFace,
			getMetricsForFamily: async (name, font) => {
				return await readMetrics(name, await cache(storage!, font.hash, () => fetchFont(font.url)));
			},
			log: (message) => logger.info('assets', message),
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
			await initialize({
				resolveMod: (id) => server.ssrLoadModule(id),
				// In dev, we cache fonts data in .astro so it can be easily inspected and cleared
				base: new URL(CACHE_DIR, settings.dotAstroDir),
			});
			// The map is always defined at this point. Its values contains urls from remote providers
			// as well as local paths for the local provider. We filter them to only keep the filepaths
			const localPaths = [...hashToUrlMap!.values()].filter((url) => isAbsolute(url));
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
				// We don't want the request to be cached in dev because we cache it already internally,
				// and it makes it easier to debug without needing hard refreshes
				res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
				res.setHeader('Pragma', 'no-cache');
				res.setHeader('Expires', 0);

				try {
					// Storage should be defined at this point since initialize it called before registering
					// the middleware. hashToUrlMap is defined at the same time so if it's not set by now,
					// no url will be matched and this line will not be reached.
					const data = await cache(storage!, hash, () => fetchFont(url));

					res.setHeader('Content-Length', data.length);
					res.setHeader('Content-Type', `font/${extractFontType(hash)}`);

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
					code: `export const fontsData = new Map(${JSON.stringify(Array.from(resolvedMap?.entries() ?? []))})`,
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
				const fontsDir = new URL('.' + baseUrl, dir);
				try {
					mkdirSync(fontsDir, { recursive: true });
				} catch (cause) {
					throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
				}
				if (hashToUrlMap) {
					logger.info('assets', 'Copying fonts...');
					await Promise.all(
						Array.from(hashToUrlMap.entries()).map(async ([hash, url]) => {
							const data = await cache(storage!, hash, () => fetchFont(url));
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
