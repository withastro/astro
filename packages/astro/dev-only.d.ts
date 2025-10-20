// IMPORTANT: do not publish this file!
// It provides typings for internal virtual modules.
// The naming convention is: virtual:astro:<feature>/<...custom>

declare module 'virtual:astro:env/internal' {
	export const schema: import('./src/env/schema.js').EnvSchema;
}

declare module 'virtual:astro:assets/fonts/internal' {
	export const internalConsumableMap: import('./src/assets/fonts/types.js').InternalConsumableMap;
	export const consumableMap: import('./src/assets/fonts/types.js').ConsumableMap;
}

declare module 'virtual:astro:actions/options' {
	export const shouldAppendTrailingSlash: boolean;
}

declare module 'virtual:astro:actions/runtime' {
	export * from './src/actions/runtime/client.js';
}

declare module 'virtual:astro:actions/entrypoint' {
	import type { SSRActions } from './src/index.js';
	export const server: SSRActions;
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
