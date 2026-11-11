import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../environment-names.js';
import { isAstroServerEnvironment } from '../environments.js';

// This is used by Cloudflare's optimizeDeps
const VIRTUAL_CLIENT_ID = 'virtual:astro:adapter-config/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0' + VIRTUAL_CLIENT_ID;

/**
 * The shape of the server output, set by whatever deploys it (a platform Vite plugin, or an
 * `astro` adapter).
 */
export interface ServerOutputOptions {
	/**
	 * Module used as the `index` input of the `ssr` build environment. When unset, the build uses
	 * the default server entry.
	 */
	entrypoint?: string | URL;
	/**
	 * Headers that client-side runtime code (prefetch, transitions, actions) adds to its internal
	 * `fetch()` calls, exported by `virtual:astro:adapter-config/client`.
	 */
	internalFetchHeaders?: Record<string, string> | (() => Record<string, string>);
}

/**
 * Applies `ServerOutputOptions`: sets the `ssr` environment's entry and serves
 * `virtual:astro:adapter-config/client`. `getOptions` is read when each hook runs.
 */
export function vitePluginServerOutput(
	getOptions: () => ServerOutputOptions | undefined,
): VitePlugin {
	return {
		name: 'astro:adapter-config',
		config() {
			const entrypoint = getOptions()?.entrypoint;
			if (entrypoint) {
				return {
					environments: {
						[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]: {
							build: {
								rolldownOptions: {
									input: {
										index: typeof entrypoint === 'string' ? entrypoint : fileURLToPath(entrypoint),
									},
								},
							},
						},
					},
				};
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CLIENT_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CLIENT_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CLIENT_ID}$`),
			},
			handler() {
				// During SSR, return empty headers to avoid any runtime issues
				if (isAstroServerEnvironment(this.environment)) {
					return {
						code: `export const internalFetchHeaders = {};`,
					};
				}

				const headers = getOptions()?.internalFetchHeaders ?? {};
				const internalFetchHeaders = typeof headers === 'function' ? headers() : headers;

				return {
					code: `export const internalFetchHeaders = ${JSON.stringify(internalFetchHeaders)};`,
				};
			},
		},
	};
}
