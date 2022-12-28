import { toRemarkInitializeAstroData } from '@astrojs/markdown-remark/dist/internal.js';
import { compile as mdxCompile } from '@mdx-js/mdx';
import { PluggableList } from '@mdx-js/mdx/lib/core.js';
import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import fs from 'node:fs/promises';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import { VFile } from 'vfile';
import type { Plugin as VitePlugin } from 'vite';
import { getRehypePlugins, getRemarkPlugins, recmaInjectImportMetaEnvPlugin } from './plugins.js';
import { getFileInfo, parseFrontmatter } from './utils.js';

const RAW_CONTENT_ERROR =
	'MDX does not support rawContent()! If you need to read the Markdown contents to calculate values (ex. reading time), we suggest injecting frontmatter via remark plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

const COMPILED_CONTENT_ERROR =
	'MDX does not support compiledContent()! If you need to read the HTML contents to calculate values (ex. reading time), we suggest injecting frontmatter via rehype plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

export type MdxOptions = {
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
	recmaPlugins?: PluggableList;
	/**
	 * Choose which remark and rehype plugins to inherit, if any.
	 *
	 * - "markdown" (default) - inherit your project’s markdown plugin config ([see Markdown docs](https://docs.astro.build/en/guides/markdown-content/#configuring-markdown))
	 * - "astroDefaults" - inherit Astro’s default plugins only ([see defaults](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins))
	 * - false - do not inherit any plugins
	 */
	extendPlugins?: 'markdown' | 'astroDefaults' | false;
	remarkRehype?: RemarkRehypeOptions;
};

export default function mdx(mdxOptions: MdxOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');
				mdxOptions.extendPlugins ??= 'markdown';

				const remarkRehypeOptions = {
					...(mdxOptions.extendPlugins === 'markdown' ? config.markdown.remarkRehype : {}),
					...mdxOptions.remarkRehype,
				};

				const mdxPluginOpts: MdxRollupPluginOptions = {
					remarkPlugins: await getRemarkPlugins(mdxOptions, config),
					rehypePlugins: getRehypePlugins(mdxOptions, config),
					recmaPlugins: mdxOptions.recmaPlugins,
					jsx: true,
					jsxImportSource: 'astro',
					// Note: disable `.md` (and other alternative extensions for markdown files like `.markdown`) support
					format: 'mdx',
					mdExtensions: [],
					remarkRehypeOptions,
				};

				let importMetaEnv: Record<string, any> = {
					SITE: config.site,
				};

				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...mdxPlugin(mdxPluginOpts),
								configResolved(resolved) {
									importMetaEnv = { ...importMetaEnv, ...resolved.env };
								},
								// Override transform to alter code before MDX compilation
								// ex. inject layouts
								async transform(_, id) {
									if (!id.endsWith('mdx')) return;

									// Read code from file manually to prevent Vite from parsing `import.meta.env` expressions
									const { fileId } = getFileInfo(id, config);
									const code = await fs.readFile(fileId, 'utf-8');

									const { data: frontmatter, content: pageContent } = parseFrontmatter(code, id);
									const compiled = await mdxCompile(new VFile({ value: pageContent, path: id }), {
										...mdxPluginOpts,
										remarkPlugins: [
											// Ensure `data.astro` is available to all remark plugins
											toRemarkInitializeAstroData({ userFrontmatter: frontmatter }),
											...(mdxPluginOpts.remarkPlugins ?? []),
										],
										recmaPlugins: [
											...(mdxPluginOpts.recmaPlugins ?? []),
											() => recmaInjectImportMetaEnvPlugin({ importMetaEnv }),
										],
									});

									return {
										code: escapeViteEnvReferences(String(compiled.value)),
										map: compiled.map,
									};
								},
							},
							{
								name: '@astrojs/mdx-postprocess',
								// These transforms must happen *after* JSX runtime transformations
								transform(code, id) {
									if (!id.endsWith('.mdx')) return;

									const [moduleImports, moduleExports] = parseESM(code);

									// Fragment import should already be injected, but check just to be safe.
									const importsFromJSXRuntime = moduleImports
										.filter(({ n }) => n === 'astro/jsx-runtime')
										.map(({ ss, se }) => code.substring(ss, se));
									const hasFragmentImport = importsFromJSXRuntime.some((statement) =>
										/[\s,{](Fragment,|Fragment\s*})/.test(statement)
									);
									if (!hasFragmentImport) {
										code = 'import { Fragment } from "astro/jsx-runtime"\n' + code;
									}

									const { fileUrl, fileId } = getFileInfo(id, config);
									if (!moduleExports.includes('url')) {
										code += `\nexport const url = ${JSON.stringify(fileUrl)};`;
									}
									if (!moduleExports.includes('file')) {
										code += `\nexport const file = ${JSON.stringify(fileId)};`;
									}
									if (!moduleExports.includes('rawContent')) {
										code += `\nexport function rawContent() { throw new Error(${JSON.stringify(
											RAW_CONTENT_ERROR
										)}) };`;
									}
									if (!moduleExports.includes('compiledContent')) {
										code += `\nexport function compiledContent() { throw new Error(${JSON.stringify(
											COMPILED_CONTENT_ERROR
										)}) };`;
									}
									if (!moduleExports.includes('Content')) {
										// Make `Content` the default export so we can wrap `MDXContent` and pass in `Fragment`
										code = code.replace('export default MDXContent;', '');
										code += `\nexport const Content = (props = {}) => MDXContent({
											...props,
											components: { Fragment, ...props.components },
										});
										export default Content;`;
									}

									// Ensures styles and scripts are injected into a `<head>`
									// When a layout is not applied
									code += `\nContent[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);`;

									if (command === 'dev') {
										// TODO: decline HMR updates until we have a stable approach
										code += `\nif (import.meta.hot) {
											import.meta.hot.decline();
										}`;
									}
									return escapeViteEnvReferences(code);
								},
							},
						] as VitePlugin[],
					},
				});
			},
		},
	};
}

// Converts the first dot in `import.meta.env` to its Unicode escape sequence,
// which prevents Vite from replacing strings like `import.meta.env.SITE`
// in our JS representation of loaded Markdown files
function escapeViteEnvReferences(code: string) {
	return code.replace(/import\.meta\.env/g, 'import\\u002Emeta.env');
}
