import { fileURLToPath } from 'node:url';
import type { ContentEntryType } from '../@types/astro.js';
import { parseFrontmatter } from '../content/utils.js';

export const markdownContentEntryType: ContentEntryType = {
	extensions: ['.md'],
	async getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
		const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
		return {
			data: parsed.data,
			body: parsed.content,
			slug: parsed.data.slug,
			rawData: parsed.matter,
		};
	},
};

/**
 * MDX content type for compatibility with older `@astrojs/mdx` versions
 * TODO: remove in next Astro minor release
 */
export const mdxContentEntryType: ContentEntryType = {
	extensions: ['.mdx'],
	async getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
		const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
		return {
			data: parsed.data,
			body: parsed.content,
			slug: parsed.data.slug,
			rawData: parsed.matter,
		};
	},
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
