import type * as vite from 'vite';

export const ASTRO_APP_ID = 'virtual:astro:app';
export const ASTRO_DEV_SERVER_APP_ID = 'astro:server-app';

export function vitePluginApp(): vite.Plugin[] {
	let command: vite.ResolvedConfig['command'];
	return [
		{
			name: 'astro:app',
			configResolved(config) {
				command = config.command;
			},
			resolveId: {
				filter: {
					id: new RegExp(`^${ASTRO_APP_ID}$`),
				},
				handler() {
					const entrypoint =
						command === 'serve'
							? './core/app/entrypoint-dev.js'
							: './core/app/entrypoint-prod.js';
					const url = new URL(entrypoint, import.meta.url);
					return this.resolve(url.toString());
				},
			},
		},
		{
			name: 'astro:server-app',
			resolveId: {
				filter: {
					id: new RegExp(`^${ASTRO_DEV_SERVER_APP_ID}$`),
				},
				handler() {
					const url = new URL('./createAstroServerApp.js', import.meta.url);
					return this.resolve(url.toString());
				},
			},
		},
	];
}
