import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { resolveProviders } from './providers.js';
import * as unifont from 'unifont';
import type { FontFamily, FontProvider } from './types.js';

interface Options {
	settings: AstroSettings;
}

const DEFAULTS: unifont.ResolveFontOptions = {
	weights: ['400'],
	styles: ['normal', 'italic'],
	subsets: ['cyrillic-ext', 'cyrillic', 'greek-ext', 'greek', 'vietnamese', 'latin-ext', 'latin'],
	fallbacks: undefined,
};

export function fonts({ settings }: Options): Plugin | undefined {
	if (!settings.config.experimental.fonts) {
		return;
	}

	const providers: Array<FontProvider<string>> = settings.config.experimental.fonts.providers ?? [];
	const families: Array<FontFamily<string>> = settings.config.experimental.fonts.families;

	// TODO: better structure (array)
	// family name
	// css
	// css with fallback (optional), to be used if no preload

	let resolvedMap: Map<
		string,
		{ data: Array<unifont.FontFaceData>; fallbacks?: Array<string> }
	> | null = null;
	const tempMap = new Map<string, string>()

	return {
		name: 'astro:fonts',
		async buildStart() {
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
			let i = 0;
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
				// TODO: generate css
				resolvedMap.set(family.name, { data: fontsData, fallbacks });
				const sources: Array<string> = fontsData
					.map((a) => a.src.map((b) => ('name' in b ? b.name : b.url)))
					.flat();
				for (const src of sources) {
					tempMap.set(`${i++}`, src)
				}
				// console.dir(fontsData);
			}
		},
		buildEnd() {
			resolvedMap = null;
		},
		async configureServer(server) {
			const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
			// TODO: take base into account
			server.middlewares.use('/_fonts', async (req, res, next) => {
				if (!req.url) {
					return next();
				}
				const key = req.url.slice(1);
				const item = tempMap.get(key);
				if (!item) {
					return next();
				}
				const data = await fetch(item)
					.then((r) => r.arrayBuffer())
					.then((r) => Buffer.from(r));
				res.setHeader('Cache-Control', `max-age=${ONE_YEAR_IN_SECONDS}`);
				res.end(data);
			});
		},
	};
}
