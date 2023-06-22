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
	// We need to handle propagation for Markdown because they support layouts which will bring in styles.
	handlePropagation: true,
};
