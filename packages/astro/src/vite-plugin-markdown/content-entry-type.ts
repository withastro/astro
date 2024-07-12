import { fileURLToPath } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import type { ContentEntryType } from '../@types/astro.js';
import { safeParseFrontmatter } from '../content/utils.js';

export const markdownContentEntryType: ContentEntryType = {
	extensions: ['.md'],
	async getEntryInfo({ contents, fileUrl }: { contents: string; fileUrl: URL }) {
		const parsed = safeParseFrontmatter(contents, fileURLToPath(fileUrl));
		return {
			data: parsed.data,
			body: parsed.content,
			slug: parsed.data.slug,
			rawData: parsed.matter,
		};
	},
	// We need to handle propagation for Markdown because they support layouts which will bring in styles.
	handlePropagation: true,

	async getRenderFunction(settings) {
		const processor = await createMarkdownProcessor(settings.config.markdown);
		return async function renderToString(entry) {
			if (!entry.body) {
				return {
					html: '',
				};
			}
			const result = await processor.render(entry.body, {
				frontmatter: entry.data,
			});
			return {
				html: result.code,
				metadata: result.metadata,
			};
		};
	},
};
