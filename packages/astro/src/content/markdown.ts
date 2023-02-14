import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AstroConfig, ContentEntryType } from '../@types/astro.js';
import { getContentPaths, parseFrontmatter } from './utils.js';
import { MARKDOWN_CONTENT_ENTRY_TYPE_NAME } from './consts.js';

export async function getMarkdownContentEntryType(
	config: Pick<AstroConfig, 'root' | 'srcDir'>,
	fs: typeof fsMod
): Promise<ContentEntryType> {
	const contentPaths = getContentPaths(config, fs);
	return {
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
		contentModuleTypes: await fs.promises.readFile(
			new URL('./markdown-types.d.ts', contentPaths.templateDir),
			'utf-8'
		),
	};
}
