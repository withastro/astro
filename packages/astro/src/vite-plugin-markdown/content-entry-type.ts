import { fileURLToPath, pathToFileURL } from 'node:url';
import { safeParseFrontmatter } from '../content/utils.js';
import { createMarkdownProcessorRouter } from '../core/markdown/processor-router.js';
import type { ContentEntryType } from '../types/public/content.js';

export const markdownContentEntryType: ContentEntryType = {
	extensions: ['.md'],
	async getEntryInfo({ contents, fileUrl }: { contents: string; fileUrl: URL }) {
		const parsed = safeParseFrontmatter(contents, fileURLToPath(fileUrl));
		return {
			data: parsed.frontmatter,
			body: parsed.content.trim(),
			slug: parsed.frontmatter.slug,
			rawData: parsed.rawFrontmatter,
		};
	},
	// We need to handle propagation for Markdown because they support layouts which will bring in styles.
	handlePropagation: true,

	async getRenderFunction(config) {
		const { experimentalRs: _, rsOptions: __, ...markdownConfig } = config.markdown || {};
		const processor = await createMarkdownProcessorRouter({
			image: config.image,
			experimentalHeadingIdCompat: config.experimental?.headingIdCompat || false,
			experimentalRs: config.experimental?.experimentalRs || false,
			rsOptions: config.markdown?.rsOptions || {
				fallbackToJs: true,
				cacheDir: './node_modules/.astro/mdx-rs',
				parallelism: 1,
			},
			...markdownConfig,
		});
		return async function renderToString(entry) {
			// Process markdown even if it's empty as remark/rehype plugins may add content or frontmatter dynamically
			const result = await processor.render(entry.body ?? '', {
				frontmatter: entry.data,
				// @ts-expect-error Internal API
				fileURL: entry.filePath ? pathToFileURL(entry.filePath) : undefined,
			});
			return {
				html: result.code,
				metadata: {
					...result.metadata,
					imagePaths: result.metadata.localImagePaths.concat(result.metadata.remoteImagePaths),
				},
			};
		};
	},
};
