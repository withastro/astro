import { markdownConfigDefaults } from '@astrojs/markdown-remark';
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

export type MdxOptions = Omit<typeof markdownConfigDefaults, 'remarkPlugins' | 'rehypePlugins'> & {
	extendMarkdownConfig: boolean;
	recmaPlugins: PluggableList;
	// Markdown allows strings as remark and rehype plugins.
	// This is not supported by the MDX compiler, so override types here.
	remarkPlugins: PluggableList;
	rehypePlugins: PluggableList;
	remarkRehype: RemarkRehypeOptions;
};

export default function mdx(partialMdxOptions: Partial<MdxOptions> = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdx');

				const extendMarkdownConfig =
					partialMdxOptions.extendMarkdownConfig ?? defaultOptions.extendMarkdownConfig;

				const mdxOptions = applyDefaultOptions({
					options: partialMdxOptions,
					defaults: extendMarkdownConfig ? config.markdown : defaultOptions,
				});

				const mdxPluginOpts: MdxRollupPluginOptions = {
					remarkPlugins: await getRemarkPlugins(mdxOptions, config),
					rehypePlugins: getRehypePlugins(mdxOptions),
					recmaPlugins: mdxOptions.recmaPlugins,
					remarkRehypeOptions: mdxOptions.remarkRehype,
					jsx: true,
					jsxImportSource: 'astro',
					// Note: disable `.md` (and other alternative extensions for markdown files like `.markdown`) support
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

const defaultOptions: MdxOptions = {
	...markdownConfigDefaults,
	extendMarkdownConfig: true,
	recmaPlugins: [],
	remarkPlugins: [],
	rehypePlugins: [],
	remarkRehype: {},
};

function applyDefaultOptions({
	options,
	defaults,
}: {
	options: Partial<MdxOptions>;
	defaults: MdxOptions;
}): MdxOptions {
	return {
		syntaxHighlight: options.syntaxHighlight ?? defaults.syntaxHighlight,
		extendMarkdownConfig: options.extendMarkdownConfig ?? defaults.extendMarkdownConfig,
		recmaPlugins: options.recmaPlugins ?? defaults.recmaPlugins,
		remarkRehype: options.remarkRehype ?? defaults.remarkRehype,
		gfm: options.gfm ?? defaults.gfm,
		smartypants: options.smartypants ?? defaults.smartypants,
		remarkPlugins: options.remarkPlugins ?? defaults.remarkPlugins,
		rehypePlugins: options.rehypePlugins ?? defaults.rehypePlugins,
		shikiConfig: options.shikiConfig ?? defaults.shikiConfig,
	};
}

// Converts the first dot in `import.meta.env` to its Unicode escape sequence,
// which prevents Vite from replacing strings like `import.meta.env.SITE`
// in our JS representation of loaded Markdown files
function escapeViteEnvReferences(code: string) {
	return code.replace(/import\.meta\.env/g, 'import\\u002Emeta.env');
}
