/// <reference types="astro/client" />

declare module 'virtual:astro-vercel:config' {
	const config: import('./src/vite-plugin-config.js').Config;
	export = config;
}
