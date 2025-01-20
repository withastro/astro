import { defineFontProvider } from '../helpers.js';
import type { ResolvedFontProvider } from '../types.js';

export const GOOGLE_PROVIDER_NAME = 'google';

export function google() {
	return defineFontProvider({
		name: GOOGLE_PROVIDER_NAME,
		entrypoint: 'astro/assets/fonts/providers/google',
	});
}

export const handle: ResolvedFontProvider['handle'] = () => {
	console.log(GOOGLE_PROVIDER_NAME);
};
