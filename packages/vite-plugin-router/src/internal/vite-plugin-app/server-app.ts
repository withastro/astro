import type * as vite from 'vite';

/** Module whose default export creates the dev server app of a runnable server environment. */
export const ASTRO_DEV_SERVER_APP_ID = 'virtual:astro:server-app';

export function vitePluginServerApp(): vite.Plugin {
	return {
		name: 'astro:server-app',
		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_DEV_SERVER_APP_ID}$`),
			},
			handler() {
				const url = new URL('../../vite-plugin-app/createAstroServerApp.js', import.meta.url);
				return this.resolve(url.toString());
			},
		},
	};
}
