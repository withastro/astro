import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';
import esbuild from 'esbuild';
import fs from 'fs';
import { transform } from '@astrojs/compiler';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

interface AstroPluginOptions {
	config: AstroConfig;
}

const virtualModuleId = '@astro-markdown-import';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

/** Transform .astro files for Vite */
export default function markdown({ config }: AstroPluginOptions): Plugin {
	// Weird vite behavior: Vite seems to use a fake "index.html" importer when you
	// have `enforce: pre`. This can probably be removed once the vite issue is fixed.
	// see: https://github.com/vitejs/vite/issues/5981
	const fakeRootImporter = fileURLToPath(new URL('index.html', config.projectRoot));
	function isRootImport(importer: string | undefined) {
		if (!importer) {
			return true;
		}
		if (importer === fakeRootImporter) {
			return true;
		}
		return false;
	}

	return {
		name: 'astro:markdown',
		enforce: 'pre',
		async resolveId(id, importer, options) {
			// Resolve virtual modules.
			if (id.startsWith(resolvedVirtualModuleId)) {
				return id;
			}
			// If the markdown file is imported from another file via ESM, resolve a JS representation
			// that defers the markdown -> HTML rendering until it is needed. This is especially useful
			// when fetching and then filtering many markdown files, like via Astro.fetchContent().
			// Otherwise, resolve directly to the actual component.
			if (id.endsWith('.md') && !isRootImport(importer)) {
				const resolvedId = await this.resolve(id, importer, { skipSelf: true, ...options });
				if (resolvedId) {
					return resolvedVirtualModuleId + resolvedId.id;
				}
			}
			// Resolve any .md files with the `?content` cache buster. This should only come from
			// an already-resolved JS module wrapper. Needed to prevent infinite loops in Vite.
			if (id.endsWith('.md?content')) {
				const resolvedId = await this.resolve(id, importer, { skipSelf: true, ...options });
				return resolvedId?.id.replace('?content', '');
			}
			return undefined;
		},
		async load(id) {
			// A markdown file has been imported via ESM!
			// Return the file's JS representation, which includes all Markdown frontmatter data
			// and a deferred render of the markdown contents.
			if (id.startsWith(resolvedVirtualModuleId)) {
				const fileId = id.substring(resolvedVirtualModuleId.length);
				let source = await fs.promises.readFile(fileId, 'utf8');
				const { data: frontmatter } = matter(source);
				return {
					code: `
						export const frontmatter = ${JSON.stringify(frontmatter)};
						export default async function load(...args) {
							return (await import(${JSON.stringify(fileId + '?content')}));
						};`,
					map: null,
				};
			}

			// A markdown file is being rendered! This markdown file was either imported
			// directly as a page in Vite, or it was a deferred render from a JS module.
			// This returns the compiled markdown -> astro component that renders to HTML.
			if (id.endsWith('.md') || id.endsWith('.md?content')) {
				const fileId = id.endsWith('?content') ? id.substring(0, id.length - '?content'.length) : id;
				let source = await fs.promises.readFile(fileId, 'utf8');
				let render = config.markdownOptions.render;
				let renderOpts = {};
				if (Array.isArray(render)) {
					renderOpts = render[1];
					render = render[0];
				}
				if (typeof render === 'string') {
					({ default: render } = await import(render));
				}
				const { data: frontmatter, content: markdownContent } = matter(source);
				let renderResult = await render(markdownContent, renderOpts);
				let { code: astroResult, metadata } = renderResult;
				const { layout = '', components = '', setup = '', ...content } = frontmatter;
				content.astro = metadata;
				const prelude = `---
${layout ? `import Layout from '${layout}';` : ''}
${components ? `import * from '${components}';` : ''}
${setup}
const $$content = ${JSON.stringify(content)}
---`;
				const imports = `${layout ? `import Layout from '${layout}';` : ''}
${setup}`.trim();
				// If the user imported "Layout", wrap the content in a Layout
				if (/\bLayout\b/.test(imports)) {
					astroResult = `${prelude}\n<Layout content={$$content}>\n\n${astroResult}\n\n</Layout>`;
				} else {
					astroResult = `${prelude}\n${astroResult}`;
				}

				const filenameURL = new URL(`file://${fileId}`);
				const pathname = filenameURL.pathname.substr(config.projectRoot.pathname.length - 1);
				// Transform from `.astro` to valid `.ts`
				let { code: tsResult } = await transform(astroResult, {
					pathname,
					projectRoot: config.projectRoot.toString(),
					site: config.buildOptions.site,
					sourcefile: id,
					sourcemap: 'inline',
					internalURL: 'astro/internal',
				});

				tsResult = `\nexport const metadata = ${JSON.stringify(metadata)};
${tsResult}`;

				// Compile from `.ts` to `.js`
				const { code } = await esbuild.transform(tsResult, { loader: 'ts', sourcemap: false, sourcefile: id });
				return {
					code,
					map: null,
				};
			}

			return null;
		},
	};
}
