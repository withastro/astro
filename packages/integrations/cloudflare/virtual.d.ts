/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare module 'virtual:astro-cloudflare:config' {
	const config: import('./src/vite-plugin-config.js').Config;
	export = config;
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
