import { defineFontProvider } from '../helpers.js';
import type { ResolvedFontProvider } from '../types.js';

export function adobe(config: { apiKey: string }) {
	return defineFontProvider({
		name: 'adobe',
		entrypoint: 'astro/assets/fonts/providers/adobe',
		config,
	});
}

export const handle: ResolvedFontProvider['handle'] = () => {};
