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
			for (const family of families) {
				const resolvedOptions: unifont.ResolveFontOptions = {
					weights: family.weights ?? DEFAULTS.weights,
					styles: family.styles ?? DEFAULTS.styles,
					subsets: family.subsets ?? DEFAULTS.subsets,
					fallbacks: family.fallbacks ?? DEFAULTS.fallbacks,
				};
				// TODO: https://github.com/unjs/unifont/issues/108
				const {
					fonts: fontsData,
					fallbacks,
					provider,
				} = await resolveFont(family.name, resolvedOptions, [family.provider]);

				// console.dir(fontsData);
				// TODO: fontaine if needed
			}
		},
		async configureServer(server) {
			return () => {
				// server.middlewares.use(() => {})
			};
		},
	};
}
