import type { Plugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { resolveProviders } from './providers.js';

/* TODO:

CACHE
- in dev, store in .astro/fonts
- in build, check in node_modules/.astro/fonts. If it doesn't exist, check in dev and copy to build

UNIFONT
FONTAINE
*/

interface Options {
	settings: AstroSettings;
}

export function fonts({ settings }: Options): Plugin | undefined {
	if (!settings.config.experimental.fonts) {
		return;
	}

	return {
		name: 'astro:fonts',
		async buildStart() {
			const resolved = await resolveProviders({
				settings,
				providers: settings.config.experimental.fonts?.providers ?? [],
			});
			for (const provider of resolved) {
				provider.handle();
			}
		},
	};
}
