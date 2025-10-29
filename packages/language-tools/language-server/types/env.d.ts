/**
 * Astro global available in all contexts in .astro files
 *
 * [Astro documentation](https://docs.astro.build/reference/api-reference/#astro-global)
 */
declare const Astro: any;
declare const Fragment: any;

declare module '*.md' {
	const md: any;
	export default md;
}

declare module '*.mdx' {
	const mdx: any;
	export default mdx;
}

declare module '*.html' {
	const html: any;
	export default html;
}
