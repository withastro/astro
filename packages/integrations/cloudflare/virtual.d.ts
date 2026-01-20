/// <reference types="@cloudflare/workers-types" />

declare module 'virtual:astro-cloudflare:config' {
	export const sessionKVBindingName: string;
	// Additional exports can be added here in the future
}

declare namespace Cloudflare {
	interface Env {
		[key: string]: unknown;
		IMAGES: import('@cloudflare/workers-types').ImagesBinding;
		ASSETS: import('@cloudflare/workers-types').Fetcher;
	}
}
