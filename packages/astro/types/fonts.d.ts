declare module 'astro:assets' {
	/** @internal Run `astro dev` or `astro sync` to generate high fidelity types */
	export type CssVariable = string;

	/** The data available on `fontData` */
	export type FontData = import('../dist/assets/fonts/types.js').FontData;

	/** @internal */
	export type FontPreloadFilter = import('../dist/assets/fonts/types.js').PreloadFilter;
}
