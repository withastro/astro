/// <reference path="./client.d.ts" />

type Astro = import('./dist/types/@types/astro').AstroGlobal;

// We duplicate the description here because editors won't show the JSDoc comment from the imported type (but will for its properties, ex: Astro.request will show the AstroGlobal.request description)
/**
 * Astro global available in all contexts in .astro files
 *
 * [Astro documentation](https://docs.astro.build/reference/api-reference/#astro-global)
 */
declare const Astro: Readonly<Astro>;

declare const Fragment: any;

declare module '*.md' {
	type MD = import('./dist/types/@types/astro').MarkdownInstance<Record<string, any>>;

	export const frontmatter: MD['frontmatter'];
	export const file: MD['file'];
	export const url: MD['url'];
	export const getHeadings: MD['getHeadings'];
	/** @deprecated Renamed to `getHeadings()` */
	export const getHeaders: () => void;
	export const Content: MD['Content'];
	export const rawContent: MD['rawContent'];
	export const compiledContent: MD['compiledContent'];

	const load: MD['default'];
	export default load;
}

declare module '*.mdx' {
	type MDX = import('astro').MDXInstance<Record<string, any>>;

	export const frontmatter: MDX['frontmatter'];
	export const file: MDX['file'];
	export const url: MDX['url'];
	export const getHeadings: MDX['getHeadings'];
	export const Content: MDX['Content'];
	export const rawContent: MDX['rawContent'];
	export const compiledContent: MDX['compiledContent'];

	const load: MDX['default'];
	export default load;
}

declare module '*.html' {
	const Component: { render(opts: { slots: Record<string, string> }): string };
	export default Component;
}
