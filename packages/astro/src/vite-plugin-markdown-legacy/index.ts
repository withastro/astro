import { renderMarkdown } from '@astrojs/markdown-remark';
import fs from 'fs';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { Plugin, ResolvedConfig, transformWithEsbuild } from 'vite';
import type { AstroSettings } from '../@types/astro';
import { pagesVirtualModuleId } from '../core/app/index.js';
import { cachedCompilation, CompileProps } from '../core/compile/index.js';
import { AstroErrorData, MarkdownError } from '../core/errors/index.js';
import type { LogOptions } from '../core/logger/core.js';
import { isMarkdownFile } from '../core/util.js';
import type { PluginMetadata as AstroPluginMetadata } from '../vite-plugin-astro/types';
import { getFileInfo, normalizeFilename } from '../vite-plugin-utils/index.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

const MARKDOWN_IMPORT_FLAG = '?mdImport';
const MARKDOWN_CONTENT_FLAG = '?content';

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

// Both end up connecting a `load()` hook to the Astro compiler, and share some copy-paste
// logic in how that is done.
export default function markdown({ settings }: AstroPluginOptions): Plugin {
	const { config } = settings;

	// Weird Vite behavior: Vite seems to use a fake "index.html" importer when you
	// have `enforce: pre`. This can probably be removed once the vite issue is fixed.
	// see: https://github.com/vitejs/vite/issues/5981
	const fakeRootImporter = fileURLToPath(new URL('index.html', config.root));
	function isRootImport(importer: string | undefined) {
		if (!importer) {
			return true;
		}
		if (importer === fakeRootImporter) {
			return true;
		}
		if (importer === '\0' + pagesVirtualModuleId) {
			return true;
		}
		return false;
	}

	let resolvedConfig: ResolvedConfig;

	return {
		name: 'astro:markdown',
		enforce: 'pre',
		async resolveId(id, importer, options) {
			// Resolve any .md (or alternative extensions of markdown files like .markdown) files with the `?content` cache buster. This should only come from
			// an already-resolved JS module wrapper. Needed to prevent infinite loops in Vite.
			// Unclear if this is expected or if cache busting is just working around a Vite bug.
			if (isMarkdownFile(id, { suffix: MARKDOWN_CONTENT_FLAG })) {
				const resolvedId = await this.resolve(id, importer, { skipSelf: true, ...options });
				return resolvedId?.id.replace(MARKDOWN_CONTENT_FLAG, '');
			}
			// If the markdown file is imported from another file via ESM, resolve a JS representation
			// that defers the markdown -> HTML rendering until it is needed. This is especially useful
			// when fetching and then filtering many markdown files, like with import.meta.glob() or Astro.glob().
			// Otherwise, resolve directly to the actual component.
			if (isMarkdownFile(id) && !isRootImport(importer)) {
				const resolvedId = await this.resolve(id, importer, { skipSelf: true, ...options });
				if (resolvedId) {
					return resolvedId.id + MARKDOWN_IMPORT_FLAG;
				}
			}
			// In all other cases, we do nothing and rely on normal Vite resolution.
			return undefined;
		},
		async load(id, opts) {
			// A markdown file has been imported via ESM!
			// Return the file's JS representation, including all Markdown
			// frontmatter and a deferred `import() of the compiled markdown content.
			if (isMarkdownFile(id, { suffix: MARKDOWN_IMPORT_FLAG })) {
				const { fileId, fileUrl } = getFileInfo(id, config);

				const source = await fs.promises.readFile(fileId, 'utf8');
				const { data: frontmatter, content: rawContent } = safeMatter(source, fileId);
				return {
					code: `
						// Static
						export const frontmatter = ${escapeViteEnvReferences(JSON.stringify(frontmatter))};
						export const file = ${JSON.stringify(fileId)};
						export const url = ${JSON.stringify(fileUrl)};
						export function rawContent() {
							return ${escapeViteEnvReferences(JSON.stringify(rawContent))};
						}
						export async function compiledContent() {
							return load().then((m) => m.compiledContent());
						}

						// Deferred
						export default async function load() {
							return (await import(${JSON.stringify(fileId + MARKDOWN_CONTENT_FLAG)}));
						}
						export function Content(...args) {
							return load().then((m) => m.default(...args));
						}
						Content.isAstroComponentFactory = true;
						export function getHeadings() {
							return load().then((m) => m.metadata.headings);
						}
						export function getHeaders() {
							console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.');
							return load().then((m) => m.metadata.headings);
						};`,
					map: null,
				};
			}

			// A markdown file is being rendered! This markdown file was either imported
			// directly as a page in Vite, or it was a deferred render from a JS module.
			// This returns the compiled markdown -> astro component that renders to HTML.
			if (isMarkdownFile(id)) {
				const filename = normalizeFilename(id, config);
				const source = await fs.promises.readFile(filename, 'utf8');
				const renderOpts = config.markdown;

				const fileUrl = new URL(`file://${filename}`);

				// Extract special frontmatter keys
				let { data: frontmatter, content: markdownContent } = safeMatter(source, filename);

				// Turn HTML comments into JS comments while preventing nested `*/` sequences
				// from ending the JS comment by injecting a zero-width space
				// Inside code blocks, this is removed during renderMarkdown by the remark-escape plugin.
				markdownContent = markdownContent.replace(
					/<\s*!--([^-->]*)(.*?)-->/gs,
					(whole) => `{/*${whole.replace(/\*\//g, '*\u200b/')}*/}`
				);

				let renderResult = await renderMarkdown(markdownContent, {
					...renderOpts,
					fileURL: fileUrl,
					isAstroFlavoredMd: true,
					isExperimentalContentCollections: settings.config.experimental.contentCollections,
				} as any);
				let { code: astroResult, metadata } = renderResult;
				const { layout = '', components = '', setup = '', ...content } = frontmatter;
				content.astro = metadata;
				content.url = getFileInfo(id, config).fileUrl;
				content.file = filename;

				const prelude = `---
import Slugger from 'github-slugger';
${layout ? `import Layout from '${layout}';` : ''}
${components ? `import * from '${components}';` : ''}
${setup}

const slugger = new Slugger();
function $$slug(value) {
	return slugger.slug(value);
}

const $$content = ${JSON.stringify(content)};

Object.defineProperty($$content.astro, 'headers', {
	get() {
		console.warn('[${JSON.stringify(id)}] content.astro.headers is now content.astro.headings.');
		return this.headings;
	}
});
---`;

				const imports = `${layout ? `import Layout from '${layout}';` : ''}
${setup}`.trim();

				// If the user imported "Layout", wrap the content in a Layout
				if (/\bLayout\b/.test(imports)) {
					astroResult = `${prelude}\n<Layout content={$$content}>\n\n${astroResult}\n\n</Layout>`;
				} else {
					// Note: without a Layout, we need to inject `head` manually so `maybeRenderHead` runs
					astroResult = `${prelude}\n<head></head>${astroResult}`;
				}

				// Transform from `.astro` to valid `.ts`
				const compileProps: CompileProps = {
					astroConfig: config,
					viteConfig: resolvedConfig,
					filename,
					source: astroResult,
					id,
				};

				let transformResult = await cachedCompilation(compileProps);
				let { code: tsResult } = transformResult;

				tsResult = `\nexport const metadata = ${JSON.stringify(metadata)};
export const frontmatter = ${JSON.stringify(content)};
export function rawContent() {
	return ${JSON.stringify(markdownContent)};
}
export function compiledContent() {
		return ${JSON.stringify(renderResult.metadata.html)};
}
${tsResult}`;

				// Compile from `.ts` to `.js`
				const { code } = await transformWithEsbuild(tsResult, id, {
					loader: 'ts',
					sourcemap: false,
				});

				const astroMetadata: AstroPluginMetadata['astro'] = {
					clientOnlyComponents: transformResult.clientOnlyComponents,
					hydratedComponents: transformResult.hydratedComponents,
					scripts: transformResult.scripts,
					propagation: 'none',
					pageOptions: {},
				};

				return {
					code: escapeViteEnvReferences(code),
					map: null,
					meta: {
						astro: astroMetadata,
						vite: {
							lang: 'ts',
						},
					},
				};
			}

			return null;
		},
	};
}

// Converts the first dot in `import.meta.env` to its Unicode escape sequence,
// which prevents Vite from replacing strings like `import.meta.env.SITE`
// in our JS representation of loaded Markdown files
function escapeViteEnvReferences(code: string) {
	return code.replace(/import\.meta\.env/g, 'import\\u002Emeta.env');
}
