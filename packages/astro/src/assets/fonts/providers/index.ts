import type { providers } from 'unifont';
import type { AstroFontProvider } from '../types.js';

/** [Adobe](https://fonts.adobe.com/) */
function adobe(config: Parameters<typeof providers.adobe>[0]) {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/adobe',
		config,
	});
}

/** [Bunny](https://fonts.bunny.net/) */
function bunny() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/bunny',
	});
}

/** [Fontshare](https://www.fontshare.com/) */
function fontshare() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/fontshare',
	});
}

/** [Fontsource](https://fontsource.org/) */
function fontsource() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/fontsource',
	});
}

// TODO: https://github.com/unjs/unifont/issues/108. Once resolved, remove the unifont patch
// This provider downloads too many files when there's a variable font
// available. This is bad because it doesn't align with our default font settings
/** [Google](https://fonts.google.com/) */
function google() {
	return defineAstroFontProvider({
		entrypoint: 'astro/assets/fonts/providers/google',
	});
}

/**
 * Astro re-exports most [unifont](https://github.com/unjs/unifont/) providers:
 * - [Adobe](https://fonts.adobe.com/)
 * - [Bunny](https://fonts.bunny.net/)
 * - [Fontshare](https://www.fontshare.com/)
 * - [Fontsource](https://fontsource.org/)
 * - [Google](https://fonts.google.com/)
 */
export const fontProviders = {
	adobe,
	bunny,
	fontshare,
	fontsource,
	google,
};

/** A type helper for defining Astro font providers config objects */
export function defineAstroFontProvider(provider: AstroFontProvider) {
	return provider;
}
