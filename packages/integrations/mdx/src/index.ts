import { compile as mdxCompile } from '@mdx-js/mdx';
import { PluggableList } from '@mdx-js/mdx/lib/core.js';
import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import { blue, bold } from 'kleur/colors';
import fs from 'node:fs/promises';
import { VFile } from 'vfile';
import type { Plugin as VitePlugin } from 'vite';
import {
	getRehypePlugins,
	getRemarkPlugins,
	recmaInjectImportMetaEnvPlugin,
	rehypeApplyFrontmatterExport,
} from './plugins.js';
import { getFileInfo, handleExtendsNotSupported, parseFrontmatter } from './utils.js';

const RAW_CONTENT_ERROR =
	'MDX does not support rawContent()! If you need to read the Markdown contents to calculate values (ex. reading time), we suggest injecting frontmatter via remark plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

const COMPILED_CONTENT_ERROR =
	'MDX does not support compiledContent()! If you need to read the HTML contents to calculate values (ex. reading time), we suggest injecting frontmatter via rehype plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

export type MdxOptions = {
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
	/**
	 * Choose which remark and rehype plugins to inherit, if any.
	 *
	 * - "markdown" (default) - inherit your project’s markdown plugin config ([see Markdown docs](https://docs.astro.build/en/guides/markdown-content/#configuring-markdown))
	 * - "astroDefaults" - inherit Astro’s default plugins only ([see defaults](https://docs.astro.build/en/reference/configuration-reference/#markdownextenddefaultplugins))
	 * - false - do not inherit any plugins
	 */
	extendPlugins?: 'markdown' | 'astroDefaults' | false;
};

export default function mdx(mdxOptions: MdxOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');
				mdxOptions.extendPlugins ??= 'markdown';

				handleExtendsNotSupported(mdxOptions.remarkPlugins);
				handleExtendsNotSupported(mdxOptions.rehypePlugins);

				// TODO: remove for 1.0. Shipping to ease migration to new minor
				if (
					mdxOptions.extendPlugins === 'markdown' &&
					(config.markdown.rehypePlugins?.length || config.markdown.remarkPlugins?.length)
				) {
					console.info(
						blue(`[MDX] Now inheriting remark and rehype plugins from "markdown" config.`)
					);
					console.info(
						`If you applied a plugin to both your Markdown and MDX configs, we suggest ${bold(
							'removing the duplicate MDX entry.'
						)}`
					);
					console.info(`See "extendPlugins" option to configure this behavior.`);
				}

				const mdxPluginOpts: MdxRollupPluginOptions = {
					remarkPlugins: await getRemarkPlugins(mdxOptions, config),
					rehypePlugins: getRehypePlugins(mdxOptions, config),
					jsx: true,
					jsxImportSource: 'astro',
					// Note: disable `.md` support
					format: 'mdx',
					mdExtensions: [],
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
										rehypePlugins: [
											...(mdxPluginOpts.rehypePlugins ?? []),
											() => rehypeApplyFrontmatterExport(frontmatter),
										],
										recmaPlugins: [() => recmaInjectImportMetaEnvPlugin({ importMetaEnv })],
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

									// Ensures styles and scripts are injected into a `<head>`
									// When a layout is not applied
									code += `\nMDXContent[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);`;

									const [, moduleExports] = parseESM(code);

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
										code += `\nexport const Content = MDXContent;`;
									}

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
