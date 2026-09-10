import { fileURLToPath } from 'node:url';
import type { PluginOption } from 'vite';

const VIRTUAL_CONFIG_ID = 'virtual:astro-cloudflare:config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

/**
 * Absolute path of the prerender-only render-scope installer, imported by the
 * generated `loadPrerenderScope` thunk. Resolved relative to this compiled
 * module (`dist/vite-plugin-config.js` → `dist/utils/prerender-scope.js`).
 */
const PRERENDER_SCOPE_PATH = fileURLToPath(new URL('./utils/prerender-scope.js', import.meta.url));

export interface CompileImageConfig {
	base: string;
	assetsPrefix: string | undefined;
	imageServiceEntrypoint: string;
	buildAssets: string;
	transformWithBinding: boolean;
}

export interface Config {
	sessionKVBindingName: string;
	compileImageConfig: CompileImageConfig | null;
	isPrerender: boolean;
	/**
	 * True when the user has configured the Cloudflare cache provider.
	 * Used by the request handler to default uncached responses to
	 * `Cloudflare-CDN-Cache-Control: no-store`, so that opting in to the
	 * cache provider never accidentally caches routes that don't use it.
	 */
	cacheProviderEnabled: boolean;
}

export function createConfigPlugin(config: Omit<Config, 'isPrerender'>): PluginOption {
	return {
		name: VIRTUAL_CONFIG_ID,
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CONFIG_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_CONFIG_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_CONFIG_ID}$`),
			},
			handler() {
				const isPrerender = this.environment?.name === 'prerender';
				return [
					...Object.entries(config).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`),
					`export const isPrerender = ${isPrerender};`,
					// The import edge to the render-scope installer — the one module with
					// a `node:async_hooks` reference — must only exist in the prerender
					// worker's module graph. A dynamic import in the handler, even inside
					// the compile-time-false `isPrerender` branch, still gets emitted as a
					// chunk of the production worker; generating the thunk per environment
					// keeps production output free of the module entirely.
					`export const loadPrerenderScope = ${
						isPrerender ? `() => import(${JSON.stringify(PRERENDER_SCOPE_PATH)})` : 'undefined'
					};`,
				].join('\n');
			},
		},
	};
}
