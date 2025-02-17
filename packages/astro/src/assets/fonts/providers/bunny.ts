import { defineFontProvider } from '../helpers.js';
import { providers } from 'unifont';

type Provider = typeof providers.bunny;

export function bunny() {
	return defineFontProvider({
		name: 'bunny',
		entrypoint: 'astro/assets/fonts/providers/bunny',
	});
}

export const provider: Provider = providers.bunny;
