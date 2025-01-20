import { defineFontProvider } from '../helpers.js';
import type { ResolvedFontProvider } from '../types.js';

export const LOCAL_PROVIDER_NAME = 'local';

export function local() {
	return defineFontProvider({
		name: LOCAL_PROVIDER_NAME,
		entrypoint: 'astro/assets/fonts/providers/local',
	});
}

export const handle: ResolvedFontProvider['handle'] = () => {
	console.log(LOCAL_PROVIDER_NAME);
};
