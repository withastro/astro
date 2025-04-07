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

// TODO: https://github.com/unjs/unifont/issues/108
// This provider downloads too many files when there's a variable font
// available. This is bad because it doesn't align with our default font settings
function google() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/google',
	});
}

/** TODO: jsdoc */
export const fontProviders = {
	adobe,
	bunny,
	fontshare,
	fontsource,
	google,
};

/** TODO: jsdoc */
export function defineAstroFontProvider(provider: FontProvider) {
	return provider;
}
