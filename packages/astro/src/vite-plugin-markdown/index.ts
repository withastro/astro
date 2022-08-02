import { renderMarkdown } from '@astrojs/markdown-remark';
import matter from 'gray-matter';
import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';
import { collectErrorMetadata } from '../core/errors.js';
import type { LogOptions } from '../core/logger/core.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';

interface AstroPluginOptions {
	config: AstroConfig;
	logging: LogOptions;
}

function safeMatter(source: string, id: string) {
	try {
		return matter(source);
	} catch (e) {
		(e as any).id = id;
		throw collectErrorMetadata(e);
	}
}

// TODO: Clean up some of the shared logic between this Markdown plugin and the Astro plugin.
// Both end up connecting a `load()` hook to the Astro compiler, and share some copy-paste
// logic in how that is done.
export default function markdown({ config, logging }: AstroPluginOptions): Plugin {
	return {
		enforce: 'pre',
		name: 'astro:markdown',
		async transform(code, id) {
			if (id.endsWith('.md')) {
				const { fileId, fileUrl } = getFileInfo(id, config);
				const raw = safeMatter(code, id);
				const renderResult = await renderMarkdown(raw.content, {
					...config.markdown,
					fileURL: fileUrl,
					isAstroFlavoredMd: false,
				} as any);

				const html = renderResult.code;
				const frontmatter = { ...raw.data, url: fileUrl, file: fileId } as any;
				const { layout } = frontmatter;

				return {
					code: `
				import { Fragment, jsx as h } from 'astro/jsx-runtime';
				${layout ? `import Layout from ${JSON.stringify(layout)};` : ''}

				export const frontmatter = ${JSON.stringify(frontmatter)};
				export const file = ${JSON.stringify(fileId)};
				export const url = ${JSON.stringify(fileUrl)};
				export function rawContent() {
					return ${JSON.stringify(raw.content)};
				}
				export function compiledContent() {
					return ${JSON.stringify(html)};
				}
				export async function Content() {
					const { layout, ...content } = frontmatter;
					const contentFragment = h(Fragment, { 'set:html': ${JSON.stringify(html)} });
					console.log(h(Layout, { content, children: contentFragment }))
					return ${
						layout
							? `h(Layout, { content, 'server:root': true, children: contentFragment })`
							: `contentFragment`
					};
				}
				export default Content;
				`,
				};
			}
		},
	};
}
