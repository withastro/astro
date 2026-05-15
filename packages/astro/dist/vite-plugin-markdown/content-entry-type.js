import { fileURLToPath, pathToFileURL } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { safeParseFrontmatter } from '../content/utils.js';
const markdownContentEntryType = {
	extensions: ['.md'],
	async getEntryInfo({ contents, fileUrl }) {
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
		const processor = await createMarkdownProcessor({
			image: config.image,
			...config.markdown,
		});
		return async function renderToString(entry) {
			const result = await processor.render(entry.body ?? '', {
				frontmatter: entry.data,
				fileURL: entry.filePath ? pathToFileURL(entry.filePath) : void 0,
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
export { markdownContentEntryType };
