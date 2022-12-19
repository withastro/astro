import { renderMarkdown } from '@astrojs/markdown-remark';
import fs from 'fs';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import type { AstroSettings } from '../@types/astro';
import { AstroErrorData, MarkdownError } from '../core/errors/index.js';
import type { LogOptions } from '../core/logger/core.js';
import { warn } from '../core/logger/core.js';
import { isMarkdownFile } from '../core/util.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import {
	escapeViteEnvReferences,
	getFileInfo,
	safelyGetAstroData,
} from '../vite-plugin-utils/index.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

function safeMatter(source: string, id: string) {
	try {
		return matter(source);
	} catch (err: any) {
		const markdownError = new MarkdownError({
			code: AstroErrorData.UnknownMarkdownError.code,
			message: err.message,
			stack: err.stack,
			location: {
				file: id,
			},
		});

		if (err.name === 'YAMLException') {
			markdownError.setErrorCode(AstroErrorData.MarkdownFrontmatterParseError.code);
			markdownError.setLocation({
				file: id,
				line: err.mark.line,
				column: err.mark.column,
			});

			markdownError.setMessage(err.reason);
		}

		throw markdownError;
	}
}

// absolute path of "astro/jsx-runtime"
const astroJsxRuntimeModulePath = normalizePath(
	fileURLToPath(new URL('../jsx-runtime/index.js', import.meta.url))
);

export default function markdown({ settings, logging }: AstroPluginOptions): Plugin {
	return {
		enforce: 'pre',
		name: 'astro:markdown',
		// Why not the "transform" hook instead of "load" + readFile?
		// A: Vite transforms all "import.meta.env" references to their values before
		// passing to the transform hook. This lets us get the truly raw value
		// to escape "import.meta.env" ourselves.
		async load(id) {
			if (isMarkdownFile(id)) {
				const { fileId, fileUrl } = getFileInfo(id, settings.config);
				const rawFile = await fs.promises.readFile(fileId, 'utf-8');
				const raw = safeMatter(rawFile, id);
				const renderResult = await renderMarkdown(raw.content, {
					...settings.config.markdown,
					fileURL: new URL(`file://${fileId}`),
					isAstroFlavoredMd: false,
					isExperimentalContentCollections: settings.config.experimental.contentCollections,
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
						`[${id}] Astro now supports MDX! Support for components in ".md" (or alternative extensions like ".markdown") files using the "setup" frontmatter is no longer enabled by default. Migrate this file to MDX or add the "legacy.astroFlavoredMarkdown" config flag to re-enable support.`
					);
				}

				const code = escapeViteEnvReferences(`
				import { Fragment, jsx as h } from '${astroJsxRuntimeModulePath}';
				${layout ? `import Layout from ${JSON.stringify(layout)};` : ''}

				const html = ${JSON.stringify(html)};

				export const _internal = {
					injectedFrontmatter: ${JSON.stringify(injectedFrontmatter)},
				}
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
									file,
									url,
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
				Content[Symbol.for('astro.needsHeadRendering')] = ${layout ? 'false' : 'true'};
				export default Content;
				`);

				return {
					code,
					meta: {
						astro: {
							hydratedComponents: [],
							clientOnlyComponents: [],
							scripts: [],
							propagation: 'none',
							pageOptions: {},
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
