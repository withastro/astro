import { defineFontProvider } from './index.js';

export const GOOGLE_PROVIDER_NAME = 'google';

// TODO: https://github.com/unjs/unifont/issues/108
// This provider downloads too many files when there's a variable font
// available. This is bad because it doesn't align with our default font settings
export function google() {
	return defineFontProvider({
		name: GOOGLE_PROVIDER_NAME,
		entrypoint: 'astro/assets/fonts/providers/google',
	});
}
