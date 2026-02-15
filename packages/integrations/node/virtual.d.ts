/// <reference types="astro/client" />

declare module 'virtual:astro-node:config' {
	const config: import('./src/types.js').Options;
	export = config;
}

// TODO: should probably be a typed module? Or expose createNodeApp()
declare module 'virtual:astro:manifest' {
	import type { SSRManifest } from './src/index.js';
	export const manifest: SSRManifest;
}