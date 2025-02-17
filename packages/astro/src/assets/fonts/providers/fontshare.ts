import { defineFontProvider } from '../helpers.js';
import { providers } from 'unifont';

type Provider = typeof providers.fontshare;

export function fontshare() {
	return defineFontProvider({
		name: 'fontshare',
		entrypoint: 'astro/assets/fonts/providers/fontshare',
	});
}

export const provider: Provider = providers.fontshare;
