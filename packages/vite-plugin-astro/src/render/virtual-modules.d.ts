declare module 'virtual:astro:client-directives' {
	export const clientDirectives: Map<string, string>;
}

declare module 'virtual:astro:component-assets' {
	import type { ComponentAssets } from '../vite-plugin-component-assets/types.js';
	export const renderConfig: { compressHTML: boolean | 'jsx'; site: string | undefined };
	export function getComponentAssets(moduleId: string): Promise<ComponentAssets>;
}

declare module 'virtual:astro:renderers' {
	import type { SSRLoadedRenderer } from '../types.js';
	export const renderers: SSRLoadedRenderer[];
}
