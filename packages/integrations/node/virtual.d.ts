/// <reference types="astro/client" />

declare module 'virtual:astro-node:config' {
	const config: import('./src/types.js').Options;
	export = config;
}
declare module 'virtual:astro-node:env-schema' {
	export const schema: import('../../astro/dist/types/public/config.js').AstroConfig['env']['schema'];
	export const mustValidate: boolean;
}
