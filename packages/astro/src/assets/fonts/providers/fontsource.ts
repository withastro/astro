import { defineFontProvider } from '../helpers.js';
import { providers } from 'unifont';

type Provider = typeof providers.fontsource;

export function fontsource() {
	return defineFontProvider({
		name: 'fontsource',
		entrypoint: 'astro/assets/fonts/providers/fontsource',
	});
}

export const provider: Provider = providers.fontsource;
