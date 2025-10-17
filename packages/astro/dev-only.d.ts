// IMPORTANT: do not publish this file! It's only intended for development within the monorepo

declare module 'virtual:astro:env/internal' {
	export const schema: import('./src/env/schema.js').EnvSchema;
}

declare module 'virtual:astro:assets/fonts/internal' {
	export const internalConsumableMap: import('./src/assets/fonts/types.js').InternalConsumableMap;
	export const consumableMap: import('./src/assets/fonts/types.js').ConsumableMap;
}

declare module 'astro:adapter-config/client' {
	export const internalFetchHeaders: Record<string, string>;
}
