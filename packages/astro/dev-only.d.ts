// IMPORTANT: do not publish this file!
// It provides typings for internal virtual modules.
// The naming convention is: virtual:astro:<feature>/<...custom>

declare module 'virtual:astro:env/internal' {
	export const schema: import('./src/env/schema.js').EnvSchema;
}

declare module 'virtual:astro:assets/fonts/internal' {
	export const componentDataByCssVariable: import('./src/assets/fonts/types.js').ComponentDataByCssVariable;
	export const fontDataByCssVariable: import('./src/assets/fonts/types.js').FontDataByCssVariable;
}

declare module 'virtual:astro:assets/fonts/runtime/font-file-url-resolver' {
	export const runtimeFontFileUrlResolver: import('./src/assets/fonts/definitions.js').RuntimeFontFileUrlResolver;
}

declare module 'virtual:astro:adapter-config/client' {
	export const internalFetchHeaders: Record<string, string>;
}

declare module 'virtual:astro:actions/options' {
	export const shouldAppendTrailingSlash: boolean;
}

declare module 'virtual:astro:actions/entrypoint' {
	export const server: import('./src/index.js').SSRActions;
}

declare module 'virtual:astro:manifest' {
	export const manifest: import('./src/index.js').SSRManifest;
}

declare module 'virtual:astro:routes' {
	export const routes: import('./src/core/app/types.js').RouteInfo[];
}

declare module 'virtual:astro:renderers' {
	export const renderers: import('./src/index.js').AstroRenderer[];
}

declare module 'virtual:astro:middleware' {
	const middleware: import('./src/index.js').AstroMiddlewareInstance;
	export default middleware;
	export = middleware;
}

declare module 'virtual:astro:session-driver' {
	export const driver: import('unstorage').Driver;
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
}

declare module 'virtual:astro:dev-css' {
	export const css: Set<import('./src/types/astro.js').ImportedDevStyles>;
}

declare module 'virtual:astro:dev-css-all' {
	export const devCSSMap: Map<
		string,
		() => Promise<{ css: Set<import('./src/types/astro.js').ImportedDevStyles> }>
	>;
}

declare module 'virtual:astro:component-metadata' {
	export const componentMetadataEntries: [
		string,
		import('./src/types/public/internal.js').SSRComponentMetadata,
	][];
}

declare module 'virtual:astro:app' {
	export const createApp: import('./src/core/app/types.js').CreateApp;
}

declare module 'virtual:astro:fetchable' {
	const fetchable: { fetch: import('./src/core/fetch/types.js').FetchHandler };
	export default fetchable;
}

declare module 'virtual:astro:get-image' {
	export const getImage: (
		options: import('./src/types/public/index.js').UnresolvedImageTransform,
	) => Promise<import('./src/types/public/index.js').GetImageResult>;
}
