import type * as vite from 'vite';

const ASTRO_APP_ID = 'virtual:astro:app';
const RESOLVED_ASTRO_APP_ID = '\0' + ASTRO_APP_ID;
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
					return RESOLVED_ASTRO_APP_ID;
				},
			},
			load: {
				filter: {
					id: new RegExp(`^${RESOLVED_ASTRO_APP_ID}$`),
				},
				handler() {
					const entrypoint =
						command === 'serve' ? 'astro/app/entrypoint/dev' : 'astro/app/entrypoint/prod';

					const code = `export { createApp } from '${entrypoint}';`;

					return {
						code,
					};
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
