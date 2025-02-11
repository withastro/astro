import * as unifont from 'unifont';
import { defineFontProvider } from '../helpers.js';
import type { LocalFontFamily } from '../types.js';

// https://fonts.nuxt.com/get-started/providers#local
// https://github.com/nuxt/fonts/blob/main/src/providers/local.ts
// https://github.com/unjs/unifont/blob/main/src/providers/google.ts

export const LOCAL_PROVIDER_NAME = 'local';

export function local() {
	return defineFontProvider({
		name: LOCAL_PROVIDER_NAME,
		entrypoint: 'astro/assets/fonts/providers/local',
	});
}

// TODO: pass a dev watcher?
export const provider = unifont.defineFontProvider(LOCAL_PROVIDER_NAME, async ({}: {}, ctx) => {
	// TODO: init

	return {
		// TODO: custom options
		resolveFont: async (family, _options) => {
			const options = (_options as any).src as LocalFontFamily['src'];
			console.log(options);
			return {
				fonts: [],
			};
		},
	};
});

// TODO: requires changes to types
const exampleLocal = {
	name: 'Roboto',
	provider: 'local',
	src: [
		{
			weights: ['400'],
			styles: ['normal'],
			path: './src/fonts/Roboto-400.woff',
		},
	],
};
