import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { resolveProviders } from './providers.js';
import * as unifont from 'unifont';
import type { FontFamily, FontProvider } from './types.js';
import xxhash from 'xxhash-wasm';
import { extname } from 'node:path';
import { getBuildOutputDir } from '../../core/build/util.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateFontFace } from './utils.js';
import {
	DEFAULTS,
	VIRTUAL_MODULE_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	URL_PREFIX,
} from './constants.js';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';

interface Options {
	settings: AstroSettings;
	sync: boolean;
}

type PreloadData = Array<{ url: string; type: string }>;

export function fonts({ settings, sync }: Options): Plugin | undefined {
	if (!settings.config.experimental.fonts) {
		return;
	}

	const providers: Array<FontProvider<string>> = settings.config.experimental.fonts.providers ?? [];
	const families: Array<FontFamily<string>> = settings.config.experimental.fonts.families;

	const baseUrl = removeTrailingForwardSlash(settings.config.base) + URL_PREFIX;

	let resolvedMap: Map<string, { preloadData: PreloadData; css: string }> | null = null;
	/** Key is `${hash}.${ext}`, value is a URL */
	let collected: Map<string, string> | null = null;

	return {
		name: 'astro:fonts',
		async buildStart() {
			const { h64ToString } = await xxhash();

			const resolved = await resolveProviders({
				settings,
				providers,
			});

			const { resolveFont } = await unifont.createUnifont(
				resolved.map((e) => e.provider(e.config)),
				{
					// TODO: cache
					storage: undefined,
				},
			);
			resolvedMap = new Map();
			collected = new Map();
			for (const family of families) {
				const resolvedOptions: unifont.ResolveFontOptions = {
					weights: family.weights ?? DEFAULTS.weights,
					styles: family.styles ?? DEFAULTS.styles,
					subsets: family.subsets ?? DEFAULTS.subsets,
					fallbacks: family.fallbacks ?? DEFAULTS.fallbacks,
				};
				// TODO: https://github.com/unjs/unifont/issues/108
				const { fonts: fontsData, fallbacks } = await resolveFont(family.name, resolvedOptions, [
					family.provider,
				]);

				// TODO: use fontaine if needed
				const preloadData: PreloadData = [];
				let css = '';
				for (const data of fontsData) {
					for (const source of data.src as unknown as Array<Record<string, string>>) {
						const key = 'name' in source ? 'name' : 'url';
						const hash = h64ToString(source[key]) + extname(source[key]);
						const url = baseUrl + hash;
						if (!collected.has(hash)) {
							collected.set(hash, source[key]);
							preloadData.push({ url, type: hash.split('.')[1] });
						}
						source[key] = url;
					}
					css += generateFontFace(family.name, data);
				}
				resolvedMap.set(family.name, { preloadData, css });
				// console.dir(fontsData);
			}

			// console.log(Object.fromEntries(collected.entries()));
		},
		async buildEnd() {
			resolvedMap = null;

			if (sync) {
				collected = null;
				return;
			}

			// Should be defined at this point
			if (!collected) {
				return;
			}

			const dir = getBuildOutputDir(settings);
			const fontsDir = new URL('.' + baseUrl, dir);
			mkdirSync(fontsDir, { recursive: true });
			await Promise.all(
				Array.from(collected.entries()).map(async ([hash, url]) => {
					const response = await fetch(url);
					const data = Buffer.from(await response.arrayBuffer());
					writeFileSync(new URL(hash, fontsDir), data);
					console.log(`Downloaded ${hash}`);
				}),
			);

			collected = null;
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
		async configureServer(server) {
			// Base is taken into account by default
			server.middlewares.use(URL_PREFIX, async (req, res, next) => {
				if (!req.url) {
					return next();
				}
				const hash = req.url.slice(1);
				const url = collected?.get(hash);
				if (!url) {
					return next();
				}
				const response = await fetch(url);
				const data = Buffer.from(await response.arrayBuffer());
				const keys = ['cache-control', 'content-type', 'content-length'];
				for (const key of keys) {
					const value = response.headers.get(key);
					if (value) {
						res.setHeader(key, value);
					}
				}
				res.end(data);
			});
		},
	};
}
