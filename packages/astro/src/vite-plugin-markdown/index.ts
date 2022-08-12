import { renderMarkdown } from '@astrojs/markdown-remark';
import fs from 'fs';
import matter from 'gray-matter';
import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';
import { collectErrorMetadata } from '../core/errors.js';
import type { LogOptions } from '../core/logger/core.js';
import { warn } from '../core/logger/core.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { getFileInfo, safelyGetAstroData } from '../vite-plugin-utils/index.js';

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

export default function markdown({ config, logging }: AstroPluginOptions): Plugin {
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
				const rawFile = await fs.promises.readFile(fileId, 'utf-8');
				const raw = safeMatter(rawFile, id);
				const renderResult = await renderMarkdown(raw.content, {
					...config.markdown,
					fileURL: new URL(`file://${fileId}`),
					isAstroFlavoredMd: false,
				} as any);

				const html = renderResult.code;
				const { headings } = renderResult.metadata;
				const { frontmatter: injectedFrontmatter } = safelyGetAstroData(renderResult.vfile.data);
				const frontmatter = {
					...injectedFrontmatter,
					...raw.data,
				} as any;

				const { layout } = frontmatter;

				if (frontmatter.setup) {
					warn(
						logging,
						'markdown',
						`[${id}] Astro now supports MDX! Support for components in ".md" files using the "setup" frontmatter is no longer enabled by default. Migrate this file to MDX or add the "legacy.astroFlavoredMarkdown" config flag to re-enable support.`
					);
				}

				const code = escapeViteEnvReferences(`
				import { Fragment, jsx as h } from 'astro/jsx-runtime';
				${layout ? `import Layout from ${JSON.stringify(layout)};` : ''}

				const html = ${JSON.stringify(html)};

				export const frontmatter = ${JSON.stringify(frontmatter)};
				export const file = ${JSON.stringify(fileId)};
				export const url = ${JSON.stringify(fileUrl)};
				export function rawContent() {
					return ${JSON.stringify(raw.content)};
				}
				export function compiledContent() {
					return html;
				}
				export function getHeadings() {
					return ${JSON.stringify(headings)};
				}
				export function getHeaders() {
					console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.');
					return getHeadings();
				};
				export async function Content() {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;
					content.astro = {};
					Object.defineProperty(content.astro, 'headings', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."')
						}
					});
					Object.defineProperty(content.astro, 'html', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."')
						}
					});
					Object.defineProperty(content.astro, 'source', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."')
						}
					});
					const contentFragment = h(Fragment, { 'set:html': html });
					return ${
						layout
							? `h(Layout, {
									content,
									frontmatter: content,
									headings: getHeadings(),
									rawContent,
									compiledContent,
									'server:root': true,
									children: contentFragment
								})`
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
