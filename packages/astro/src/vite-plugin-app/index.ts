import type * as vite from 'vite';

export const ASTRO_DEV_APP_ID = 'astro:app';

export function vitePluginApp(): vite.Plugin {
	return {
		name: 'astro:app',

		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_DEV_APP_ID}$`),
			},
			handler() {
				const url = new URL('./createAstroServerApp.js', import.meta.url);
				return this.resolve(url.toString());
			},
		},
	};
}
