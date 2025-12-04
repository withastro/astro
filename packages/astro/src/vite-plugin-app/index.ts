import type * as vite from 'vite';

export const ASTRO_DEV_APP_ID = 'astro:app';

export function vitePluginApp(): vite.Plugin {
	return {
		name: 'astro:app',

		async resolveId(id) {
			if (id === ASTRO_DEV_APP_ID) {
				const url = new URL('./createAstroServerApp.js', import.meta.url);
				return await this.resolve(url.toString());
			}
		},
	};
}
