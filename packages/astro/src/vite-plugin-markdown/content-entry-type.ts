import { fileURLToPath } from 'node:url';
import { ContentEntryType } from '../@types/astro.js';
import { parseFrontmatter } from '../content/utils.js';

export const MARKDOWN_CONTENT_ENTRY_TYPE_NAME = 'astro:markdown';

export const markdownContentEntryType: ContentEntryType = {
	name: MARKDOWN_CONTENT_ENTRY_TYPE_NAME,
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
