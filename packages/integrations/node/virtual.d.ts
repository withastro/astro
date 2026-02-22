/// <reference types="astro/client" />

declare module 'virtual:astro-node:config' {
	const config: import('./src/types.js').Options;
	export = config;
}
