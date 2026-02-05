/// <reference types="astro/client" />

declare module 'virtual:astro-node:config' {
	const config: import('./src/vite-plugin-config.js').Config;
	export = config;
}