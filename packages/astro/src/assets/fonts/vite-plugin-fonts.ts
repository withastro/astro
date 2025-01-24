import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { resolveProviders } from './providers.js';
import * as unifont from 'unifont';
import type { FontFamily, FontProvider } from './types.js';
import xxhash from 'xxhash-wasm';
import { extname } from 'node:path';

interface Options {
	settings: AstroSettings;
}

const DEFAULTS: unifont.ResolveFontOptions = {
	weights: ['400'],
	styles: ['normal', 'italic'],
	subsets: ['cyrillic-ext', 'cyrillic', 'greek-ext', 'greek', 'vietnamese', 'latin-ext', 'latin'],
	fallbacks: undefined,
};

const VIRTUAL_MODULE_ID = 'virtual:astro:assets/fonts/internal';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

function generateFontFace(family: string, font: unifont.FontFaceData) {
	return [
		'@font-face {',
		`  font-family: '${family}';`,
		`  src: ${renderFontSrc(font.src)};`,
		`  font-display: ${font.display || 'swap'};`,
		font.unicodeRange && `  unicode-range: ${font.unicodeRange};`,
		font.weight &&
			`  font-weight: ${Array.isArray(font.weight) ? font.weight.join(' ') : font.weight};`,
		font.style && `  font-style: ${font.style};`,
		font.stretch && `  font-stretch: ${font.stretch};`,
		font.featureSettings && `  font-feature-settings: ${font.featureSettings};`,
		font.variationSettings && `  font-variation-settings: ${font.variationSettings};`,
		`}`,
	]
		.filter(Boolean)
		.join('\n');
}

function renderFontSrc(sources: Exclude<unifont.FontFaceData['src'][number], string>[]) {
	return sources
		.map((src) => {
			if ('url' in src) {
				let rendered = `url("${src.url}")`;
				for (const key of ['format', 'tech'] as const) {
					if (key in src) {
						rendered += ` ${key}(${src[key]})`;
					}
				}
				return rendered;
			}
			return `local("${src.name}")`;
		})
		.join(', ');
}

export function fonts({ settings }: Options): Plugin | undefined {
	if (!settings.config.experimental.fonts) {
		return;
	}

	const providers: Array<FontProvider<string>> = settings.config.experimental.fonts.providers ?? [];
	const families: Array<FontFamily<string>> = settings.config.experimental.fonts.families;

	// TODO: css
	let resolvedMap: Map<string, { hashes: Array<string>; css: string }> | null = null;
	// HASH/URL
	const collected = new Map<string, string>();

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
				const hashes: Array<string> = [];
				let css = '';
				for (const data of fontsData) {
					for (const source of data.src as unknown as Array<Record<string, string>>) {
						const key = 'name' in source ? 'name' : 'url';
						const hash = h64ToString(source[key]) + extname(source[key]);
						if (!collected.has(hash)) {
							collected.set(hash, source[key]);
							hashes.push(hash);
						}
						source[key] = `/_fonts/${hash}`;
					}
					css += generateFontFace(family.name, data);
				}
				resolvedMap.set(family.name, { hashes, css });
				// console.dir(fontsData);
			}

			// console.log(Object.fromEntries(collected.entries()));
		},
		buildEnd() {
			resolvedMap = null;
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
			const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
			// TODO: take base into account
			server.middlewares.use('/_fonts', async (req, res, next) => {
				if (!req.url) {
					return next();
				}
				const hash = req.url.slice(1);
				const url = collected.get(hash);
				if (!url) {
					return next();
				}
				const data = await fetch(url)
					.then((r) => r.arrayBuffer())
					.then((r) => Buffer.from(r));
				res.setHeader('Cache-Control', `max-age=${ONE_YEAR_IN_SECONDS}`);
				res.end(data);
			});
		},
	};
}
