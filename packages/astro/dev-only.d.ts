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

declare module 'virtual:astro:adapter-config/client' {
	export const internalFetchHeaders: Record<string, string>;
}

declare module 'virtual:astro:actions/options' {
	export const shouldAppendTrailingSlash: boolean;
}

declare module 'virtual:astro:actions/entrypoint' {
	import type { SSRActions } from './src/index.js';
	export const server: SSRActions;
}

declare module 'virtual:astro:manifest' {
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

declare module 'virtual:astro:middleware' {
	import type { AstroMiddlewareInstance } from './src/index.js';
	const middleware: AstroMiddlewareInstance;
	export default middleware;
}

declare module 'virtual:astro:session-driver' {
	import type { Driver } from 'unstorage';
	export const driver: Driver;
}

declare module 'virtual:astro:pages' {
	export const pageMap: Map<string, () => Promise<any>>;
}

declare module 'virtual:astro:server-islands' {
	export const serverIslandMap: Map<string, () => Promise<any>>;
}

declare module 'virtual:astro:adapter-entrypoint' {
	export const createExports: ((manifest: any, args: any) => any) | undefined;
	export const start: ((manifest: any, args: any) => void) | undefined;
	export default any;
}

declare module 'virtual:astro:adapter-config' {
	export const args: any;
	export const exports: string[] | undefined;
	export const adapterFeatures: any;
	export const serverEntrypoint: string;
}

declare module 'virtual:astro:dev-css' {
	import type { ImportedDevStyles } from './src/types/astro.js';
	export const css: Set<ImportedDevStyles>;
}

declare module 'virtual:astro:dev-css-all' {
	import type { ImportedDevStyles } from './src/types/astro.js';
	export const devCSSMap: Map<string, () => Promise<{ css: Set<ImportedDevStyles> }>>;
}
