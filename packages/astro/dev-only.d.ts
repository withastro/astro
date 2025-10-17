// IMPORTANT: do not publish this file! It's only intended for development within the monorepo

declare module 'virtual:astro:env/internal' {
	export const schema: import('./src/env/schema.js').EnvSchema;
}

declare module 'virtual:astro:assets/fonts/internal' {
	export const fontsData: import('./src/assets/fonts/types.js').ConsumableMap;
}

declare module 'virtual:astro:serialized-manifest' {
	import type { SSRManifest } from './src/index.js';
	export const manifest: SSRManifest;
}

declare module 'virtual:astro:routes' {
	import type { RoutesList } from './src/types/astro.js';
	export const routes: RoutesList[];
}

declare module 'virtual:astro:renderers' {
	import type { AstroRenderer } from './src/index.js';
	export const renderers: AstroRenderer[];
}
