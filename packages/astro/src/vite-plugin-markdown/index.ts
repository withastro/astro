import { renderMarkdown } from '@astrojs/markdown-remark';
import matter from 'gray-matter';
import fs from 'fs';
import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';
import { collectErrorMetadata } from '../core/errors.js';
import type { LogOptions } from '../core/logger/core.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
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

export default function markdown({ config }: AstroPluginOptions): Plugin {
	return {
		enforce: 'pre',
		name: 'astro:markdown',
		// Why not the "transform" hook instead of "load" + readFile?
		// A: Vite transforms all "import.meta.env" references to their values before
		// passing to the transform hook. This lets us get the truly raw value
		// to escape "import.meta.env" ourselves.
		async load(id) {
			if (id.endsWith('.md')) {
				const { fileId, fileUrl } = getFileInfo(id, config);
				const rawFile = String(await fs.promises.readFile(fileId));
				const raw = safeMatter(rawFile, id);
				const renderResult = await renderMarkdown(raw.content, {
					...config.markdown,
					fileURL: new URL(`file://${fileId}`),
					isAstroFlavoredMd: false,
				} as any);

				const html = renderResult.code;
				const frontmatter = { ...raw.data, url: fileUrl, file: fileId } as any;
				const { layout } = frontmatter;

				const code = escapeViteEnvReferences(`
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
					return ${
						layout
							? `h(Layout, { content, 'server:root': true, children: contentFragment })`
							: `contentFragment`
					};
				}
				export default Content;
				`);
				return {
					code,
					meta: {
						astro: {
							hydratedComponents: [],
							clientOnlyComponents: [],
							scripts: [],
						} as PluginMetadata['astro'],
						vite: {
							lang: 'ts',
						},
					},
				};
			}
		},
	};
}

// Converts the first dot in `import.meta.env` to its Unicode escape sequence,
// which prevents Vite from replacing strings like `import.meta.env.SITE`
// in our JS representation of loaded Markdown files
function escapeViteEnvReferences(code: string) {
	return code.replace(/import\.meta\.env/g, 'import\\u002Emeta.env');
}
