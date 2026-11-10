declare module 'virtual:astro:manifest' {
	export const manifest: import('./internal/core/app/types.js').SSRManifest;
}

declare module 'virtual:astro:routes' {
	export const routes: import('./internal/core/app/types.js').RouteInfo[];
}

declare module 'virtual:astro:dev-css-all' {
	export const devCSSMap: Map<
		string,
		() => Promise<{ css: Set<import('./types.js').ImportedDevStyle> }>
	>;
}

declare module 'virtual:astro:fetchable' {
	const fetchable: { fetch: import('./internal/core/fetch/types.js').FetchHandler };
	export default fetchable;
	export const isDefaultFetchHandler: true | undefined;
}

declare module 'virtual:astro:app' {
	export const createApp: import('./internal/core/app/types.js').CreateApp;
}

declare module 'virtual:astro:component-metadata' {
	export const componentMetadataEntries: [
		string,
		import('@astrojs/vite-plugin-astro').SSRComponentMetadata,
	][];
}
