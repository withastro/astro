import type { ContentEntryType } from '../@types/astro.js';
import { parseFrontmatter } from '../content/utils.js';

export const markdownContentEntryType: ContentEntryType = {
	extensions: ['.md'],
	async getEntryInfo({ contents }: { contents: string }) {
		const parsed = parseFrontmatter(contents);
		return {
			data: parsed.data,
			body: parsed.content,
			slug: parsed.data.slug,
			rawData: parsed.matter,
		};
	},
	// We need to handle propagation for Markdown because they support layouts which will bring in styles.
	handlePropagation: true,
};

/**
 * MDX content type for compatibility with older `@astrojs/mdx` versions
 * TODO: remove in next Astro minor release
 */
export const mdxContentEntryType: ContentEntryType = {
	extensions: ['.mdx'],
	async getEntryInfo({ contents }: { contents: string }) {
		const parsed = parseFrontmatter(contents);
		return {
			data: parsed.data,
			body: parsed.content,
			slug: parsed.data.slug,
			rawData: parsed.matter,
		};
	},
	// MDX can import scripts and styles,
	// so wrap all MDX files with script / style propagation checks
	handlePropagation: true,
	contentModuleTypes: `declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}`,
};
