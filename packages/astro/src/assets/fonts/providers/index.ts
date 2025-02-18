import type { providers } from 'unifont';
import type { FontProvider } from '../types.js';

function adobe(config: Parameters<typeof providers.adobe>[0]) {
	return defineFontProvider({
		name: 'adobe',
		entrypoint: 'astro/assets/fonts/providers/adobe',
		config,
	});
}

function bunny() {
	return defineFontProvider({
		name: 'bunny',
		entrypoint: 'astro/assets/fonts/providers/bunny',
	});
}

function fontshare() {
	return defineFontProvider({
		name: 'fontshare',
		entrypoint: 'astro/assets/fonts/providers/fontshare',
	});
}

function fontsource() {
	return defineFontProvider({
		name: 'fontsource',
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
export function defineFontProvider<TName extends string>(provider: FontProvider<TName>) {
	return provider;
}
