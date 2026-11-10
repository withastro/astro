import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin, type ResolvedConfig } from 'vite';

const ASTRO_APP_ID = 'virtual:astro:app';
const RESOLVED_ASTRO_APP_ID = '\0' + ASTRO_APP_ID;

function entrypoint(name: 'dev' | 'prod'): string {
	return normalizePath(
		fileURLToPath(new URL(`../core/app/entrypoints/${name}.js`, import.meta.url)),
	);
}

/** The specifiers `virtual:astro:app` re-exports `createApp()` from, resolved from the project root. */
export interface AppEntrypoints {
	dev: string;
	prod: string;
}

/**
 * `virtual:astro:app` exports `createApp()`: the dev app of a server environment that cannot
 * run modules through Vite (`DevFacadeApp`) when Vite serves, the production `App` when it builds.
 * `entrypoints` defaults to this package's entrypoint modules.
 */
export function vitePluginApp(
	entrypoints: AppEntrypoints = { dev: entrypoint('dev'), prod: entrypoint('prod') },
): Plugin {
	let command: ResolvedConfig['command'];
	return {
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
				const module = command === 'serve' ? entrypoints.dev : entrypoints.prod;
				return { code: `export { createApp } from ${JSON.stringify(module)};` };
			},
		},
	};
}
