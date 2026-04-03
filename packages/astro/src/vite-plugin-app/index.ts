import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';

const ASTRO_APP_ID = 'virtual:astro:app';
const RESOLVED_ASTRO_APP_ID = '\0' + ASTRO_APP_ID;
export const ASTRO_DEV_SERVER_APP_ID = 'astro:server-app';
export const ASTRO_DEV_USER_APP_ID = 'astro:user-app';
const RESOLVED_ASTRO_DEV_USER_APP_ID = '\0' + ASTRO_DEV_USER_APP_ID;
const DEFAULT_ASTRO_DEV_USER_APP_ID = '\0default:' + ASTRO_DEV_USER_APP_ID;

export function vitePluginApp({ settings }: { settings: AstroSettings }): vite.Plugin[] {
	let command: vite.ResolvedConfig['command'];
	let resolvedUserAppId: string | undefined;
	const userAppEntrypoint = `${decodeURI(settings.config.srcDir.pathname)}app.ts`;
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

					const code = `
import { createApp } from '${entrypoint}';

export { createApp };
export const app = createApp();
`.trim();

					return {
						code,
					};
				},
			},
		},
		{
			name: 'astro:user-app',
			resolveId: {
				filter: {
					id: new RegExp(`^${ASTRO_DEV_USER_APP_ID}$`),
				},
				async handler() {
					const userApp = await this.resolve(userAppEntrypoint);
					if (!userApp) {
						return DEFAULT_ASTRO_DEV_USER_APP_ID;
					}
					resolvedUserAppId = userApp.id;
					return RESOLVED_ASTRO_DEV_USER_APP_ID;
				},
			},
			load: {
				filter: {
					id: new RegExp(`^(${RESOLVED_ASTRO_DEV_USER_APP_ID}|${DEFAULT_ASTRO_DEV_USER_APP_ID})$`),
				},
				handler(id) {
					if (id === DEFAULT_ASTRO_DEV_USER_APP_ID) {
						return {
							code: `
import { Hono, astro } from 'astro/hono';

const app = new Hono();
app.onError((err) => { throw err; });
app.use(astro());

export default app;
`.trim(),
						};
					}

					return {
						code: `export { default } from '${resolvedUserAppId}';`,
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
