import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import { toRemarkInitializeAstroData } from '@astrojs/markdown-remark/dist/internal.js';
import { createProcessor } from '@mdx-js/mdx';
import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import mdxPlugin, { type Options as MdxRollupPluginOptions } from '@mdx-js/rollup';
import type { AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import { SourceMapGenerator } from 'source-map';
import { VFile } from 'vfile';
import type { Plugin as VitePlugin } from 'vite';
import { getRehypePlugins, getRemarkPlugins, recmaInjectImportMetaEnvPlugin } from './plugins.js';
import { getFileInfo, ignoreStringPlugins, parseFrontmatter } from './utils.js';

export type MdxOptions = Omit<typeof markdownConfigDefaults, 'remarkPlugins' | 'rehypePlugins'> & {
	extendMarkdownConfig: boolean;
	recmaPlugins: PluggableList;
	// Markdown allows strings as remark and rehype plugins.
	// This is not supported by the MDX compiler, so override types here.
	remarkPlugins: PluggableList;
	rehypePlugins: PluggableList;
	remarkRehype: RemarkRehypeOptions;
};

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `addPageExtension` and `contentEntryType` are not a public APIs
	// Add type defs here
	addPageExtension: (extension: string) => void;
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export default function mdx(partialMdxOptions: Partial<MdxOptions> = {}): AstroIntegration {
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async (params) => {
				const { updateConfig, config, addPageExtension, addContentEntryType, command } =
					params as SetupHookParams;

				addPageExtension('.mdx');
				addContentEntryType({
					extensions: ['.mdx'],
					async getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
						const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
						return {
							data: parsed.data,
							body: parsed.content,
							slug: parsed.data.slug,
							rawData: parsed.matter,
						};
					},
					contentModuleTypes: await fs.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8'
					),
				});

				const extendMarkdownConfig =
					partialMdxOptions.extendMarkdownConfig ?? defaultMdxOptions.extendMarkdownConfig;

				const mdxOptions = applyDefaultOptions({
					options: partialMdxOptions,
					defaults: markdownConfigToMdxOptions(
						extendMarkdownConfig ? config.markdown : markdownConfigDefaults
					),
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
									const { fileUrl, fileId } = getFileInfo(id, config);
									const code = await fs.readFile(fileId, 'utf-8');

									const { data: frontmatter, content: pageContent } = parseFrontmatter(code, id);
									const vfile = new VFile({ value: pageContent, path: id });
									const processor = createProcessor({
										...mdxPluginOpts,
										format: 'mdx',
										elementAttributeNameCase: 'html',
										remarkPlugins: [
											// Ensure `data.astro` is available to all remark plugins
											toRemarkInitializeAstroData({ userFrontmatter: frontmatter }),
											...(mdxPluginOpts.remarkPlugins ?? []),
										],
										recmaPlugins: [
											...(mdxPluginOpts.recmaPlugins ?? []),
											() => recmaInjectImportMetaEnvPlugin({ importMetaEnv }),
										],
										SourceMapGenerator: config.vite.build?.sourcemap
											? SourceMapGenerator
											: undefined,
									});

									// strip out recma plugins
									const unwantedRecmaPluginNames = [
										'recmaDocument',
										'recmaJsxRewrite',
										'recmaJsxBuild',
									];
									for (let i = 0; i < processor.attachers.length; i++) {
										const attacher = processor.attachers[i];
										if (unwantedRecmaPluginNames.includes(attacher[0].name)) {
											processor.attachers.splice(i, 1);
										}
									}

									const compiled = await processor.process(vfile);
									let compiledCode = compiled.toString();
									// Remove `<></>` from the end of the file
									compiledCode = compiledCode.replace('<></>;', '');
									// Add metadata
									compiledCode += `\nexport const url = ${JSON.stringify(fileUrl)};`;
									compiledCode += `\nexport const file = ${JSON.stringify(fileId)};`;
									// Ensures styles and scripts are injected into a `<head>`
									// When a layout is not applied
									compiledCode += `\nContent[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);`;
									compiledCode += `\nContent.moduleId = ${JSON.stringify(id)};`;

									if (command === 'dev') {
										// TODO: decline HMR updates until we have a stable approach
										compiledCode += `\nif (import.meta.hot) {
	import.meta.hot.decline();
}`;
									}

									// console.log(compiledCode)

									return {
										code: escapeViteEnvReferences(compiledCode),
										map: compiled.map,
										meta: {
											astro: vfile.data.rehypeAstro,
											vite: {
												lang: 'ts',
											},
										},
									};
								},
							},
						] as VitePlugin[],
					},
				});
			},
		},
	};
}

const defaultMdxOptions = {
	extendMarkdownConfig: true,
	recmaPlugins: [],
};

function markdownConfigToMdxOptions(markdownConfig: typeof markdownConfigDefaults): MdxOptions {
	return {
		...defaultMdxOptions,
		...markdownConfig,
		remarkPlugins: ignoreStringPlugins(markdownConfig.remarkPlugins),
		rehypePlugins: ignoreStringPlugins(markdownConfig.rehypePlugins),
		remarkRehype: (markdownConfig.remarkRehype as any) ?? {},
	};
}

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
