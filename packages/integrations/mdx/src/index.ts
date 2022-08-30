import { compile as mdxCompile } from '@mdx-js/mdx';
import mdxPlugin, { Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration } from 'astro';
import { parse as parseESM } from 'es-module-lexer';
import { blue, bold } from 'kleur/colors';
import { VFile } from 'vfile';
import type { Plugin as VitePlugin } from 'vite';
import { rehypeApplyFrontmatterExport } from './astro-data-utils.js';
import type { MdxOptions } from './utils.js';
import {
	getFileInfo,
	getRehypePlugins,
	getRemarkPlugins,
	handleExtendsNotSupported,
	parseFrontmatter,
} from './utils.js';

const RAW_CONTENT_ERROR =
	'MDX does not support rawContent()! If you need to read the Markdown contents to calculate values (ex. reading time), we suggest injecting frontmatter via remark plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

const COMPILED_CONTENT_ERROR =
	'MDX does not support compiledContent()! If you need to read the HTML contents to calculate values (ex. reading time), we suggest injecting frontmatter via rehype plugins. Learn more on our docs: https://docs.astro.build/en/guides/integrations-guide/mdx/#inject-frontmatter-via-remark-or-rehype-plugins';

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
					console.log(
						blue(`[MDX] Now inheriting remark and rehype plugins from "markdown" config.`)
					);
					console.log(
						`If you applied a plugin to both your Markdown and MDX configs, we suggest ${bold(
							'removing the duplicate MDX entry.'
						)}`
					);
					console.log(`See "extendPlugins" option to configure this behavior.`);
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

				updateConfig({
					vite: {
						plugins: [
							{
								enforce: 'pre',
								...mdxPlugin(mdxPluginOpts),
								// Override transform to alter code before MDX compilation
								// ex. inject layouts
								async transform(code, id) {
									if (!id.endsWith('mdx')) return;

									const { data: frontmatter, content: pageContent } = parseFrontmatter(code, id);
									const compiled = await mdxCompile(new VFile({ value: pageContent, path: id }), {
										...mdxPluginOpts,
										rehypePlugins: [
											...(mdxPluginOpts.rehypePlugins ?? []),
											() => rehypeApplyFrontmatterExport(frontmatter),
										],
									});

									return {
										code: String(compiled.value),
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
									return code;
								},
							},
						] as VitePlugin[],
					},
				});
			},
		},
	};
}
