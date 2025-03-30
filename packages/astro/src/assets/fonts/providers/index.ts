import type { providers } from 'unifont';
import type { FontProvider } from '../types.js';

function adobe(config: Parameters<typeof providers.adobe>[0]) {
	return defineFontProvider({
		entrypoint: 'astro/assets/fonts/providers/adobe',
		config,
	});
}

function bunny() {
	return defineFontProvider({
		entrypoint: 'astro/assets/fonts/providers/bunny',
	});
}

function fontshare() {
	return defineFontProvider({
		entrypoint: 'astro/assets/fonts/providers/fontshare',
	});
}

function fontsource() {
	return defineFontProvider({
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
export function defineFontProvider(provider: FontProvider) {
	return provider;
}
