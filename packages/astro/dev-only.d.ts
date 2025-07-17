// IMPORTANT: do not publish this file! It's only intended for development within the monorepo

declare module 'virtual:astro:env/internal' {
	export const schema: import('./src/env/schema.js').EnvSchema;
}

declare module 'virtual:astro:assets/fonts/internal' {
	export const fontsData: import('./src/assets/fonts/types.js').ConsumableMap;
}
