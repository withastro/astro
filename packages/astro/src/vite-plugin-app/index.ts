import type * as vite from 'vite';

const VIRTUAL_MODULE_ID = 'astro:app';

export function vitePluginApp(): vite.Plugin {
	return {
		name: 'astro:app',

		async resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				const url = new URL('./createExports.js', import.meta.url);
				return await this.resolve(url.toString());
			}
		},
	};
}
