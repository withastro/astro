/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare module 'virtual:astro-cloudflare:config' {
	export const sessionKVBindingName: string;
	export const compileImageConfig: import('./src/vite-plugin-config.js').CompileImageConfig | null;
	export const isPrerender: boolean;
	export const cacheProviderEnabled: boolean;
	/**
	 * Prerender-environment-only loader for the render-scope installer; the
	 * import edge (and its `node:async_hooks` reference) exists only in the
	 * prerender worker's module graph. `undefined` in production builds.
	 */
	export const loadPrerenderScope:
		| (() => Promise<typeof import('./src/utils/prerender-scope.js')>)
		| undefined;
}

declare namespace Cloudflare {
	interface Env {
		[key: string]: unknown;
		IMAGES: ImagesBinding;
		ASSETS: Fetcher;
	}
}

// These are globals
interface Env extends Cloudflare.Env {}
type ImagesBinding = import('@cloudflare/workers-types').ImagesBinding;
type Fetcher = import('@cloudflare/workers-types').Fetcher;

declare var astroCloudflareConfig: import('@cloudflare/vite-plugin').PluginConfig;
