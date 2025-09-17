declare module 'astro:assets' {
	/** @internal Run `astro dev` or `astro sync` to generate high fidelity types */
	export type CssVariable = string;

	/** The data returned by `getFontData()` */
	export type FontData = import('../dist/assets/fonts/types.js').FontData;
}
