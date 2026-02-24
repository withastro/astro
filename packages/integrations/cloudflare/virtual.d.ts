/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare module 'virtual:astro-cloudflare:config' {
	export const sessionKVBindingName: string;
	export const compileImageConfig: import('./src/vite-plugin-config.js').CompileImageConfig | null;
	export const isPrerender: boolean;
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

declare var astroCloudflareOptions: import('@cloudflare/vite-plugin').PluginConfig;
