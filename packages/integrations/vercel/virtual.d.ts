/// <reference types="astro/client" />

declare module 'virtual:astro-vercel:config' {
	const config: import('./src/vite-plugin-config.js').Config;
	export = config;
}

declare module 'virtual:astro-vercel:instrumentation' {
	export function runWithInboundTraceContext<T>(headers: Headers, callback: () => T): T;
}
