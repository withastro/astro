import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { resolveProviders } from './providers.js';
import * as unifont from 'unifont';
import type { FontFamily, FontProvider } from './types.js';

interface Options {
	settings: AstroSettings;
}

export function fonts({ settings }: Options): Plugin | undefined {
	if (!settings.config.experimental.fonts) {
		return;
	}

	const providers: Array<FontProvider<any>> = settings.config.experimental.fonts.providers ?? [];
	const families: Array<FontFamily<any>> = settings.config.experimental.fonts.families;

	return {
		name: 'astro:fonts',
		async buildStart() {
			const resolved = await resolveProviders({
				settings,
				providers,
			});

			const instance = await unifont.createUnifont(
				resolved.map((e) => e.provider(e.config)),
				{
					// TODO: cache
					storage: undefined,
				},
			);
			for (const family of families) {
				const { fonts: fontsData, fallbacks } = await instance.resolveFont(family.name, {}, [
					family.provider,
				]);

				console.dir(fontsData, { depth: null });
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
