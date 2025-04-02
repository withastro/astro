import type { providers } from 'unifont';
import type { FontProvider } from '../types.js';

function adobe(config: Parameters<typeof providers.adobe>[0]) {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/adobe',
		config,
	});
}

function bunny() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/bunny',
	});
}

function fontshare() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/fontshare',
	});
}

function fontsource() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/fontsource',
	});
}

/** TODO: jsdoc */
export const fontProviders = {
	adobe,
	bunny,
	fontshare,
	fontsource,
};

/** TODO: jsdoc */
export function defineAstroFontProvider(provider: FontProvider) {
	return provider;
}
