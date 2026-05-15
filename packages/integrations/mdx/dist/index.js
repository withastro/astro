import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import { ignoreStringPlugins, safeParseFrontmatter } from './utils.js';
import { vitePluginMdx } from './vite-plugin-mdx.js';
import { vitePluginMdxPostprocess } from './vite-plugin-mdx-postprocess.js';
function getContainerRenderer() {
	return {
		name: 'astro:jsx',
		serverEntrypoint: '@astrojs/mdx/server.js',
	};
}
function mdx(partialMdxOptions = {}) {
	let vitePluginMdxOptions = {};
	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async (params) => {
				const { updateConfig, config, addPageExtension, addContentEntryType, addRenderer } = params;
				addRenderer({
					name: 'astro:jsx',
					serverEntrypoint: new URL('../dist/server.js', import.meta.url),
				});
				addPageExtension('.mdx');
				addContentEntryType({
					extensions: ['.mdx'],
					async getEntryInfo({ fileUrl, contents }) {
						const parsed = safeParseFrontmatter(contents, fileURLToPath(fileUrl));
						return {
							data: parsed.frontmatter,
							body: parsed.content.trim(),
							slug: parsed.frontmatter.slug,
							rawData: parsed.rawFrontmatter,
						};
					},
					contentModuleTypes: await fs.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8',
					),
					// MDX can import scripts and styles,
					// so wrap all MDX files with script / style propagation checks
					handlePropagation: true,
				});
				updateConfig({
					vite: {
						plugins: [vitePluginMdx(vitePluginMdxOptions), vitePluginMdxPostprocess(config)],
					},
				});
			},
			'astro:config:done': ({ config, logger }) => {
				const extendMarkdownConfig =
					partialMdxOptions.extendMarkdownConfig ?? defaultMdxOptions.extendMarkdownConfig;
				const resolvedMdxOptions = applyDefaultOptions({
					options: partialMdxOptions,
					defaults: markdownConfigToMdxOptions(
						extendMarkdownConfig ? config.markdown : markdownConfigDefaults,
						logger,
					),
				});
				Object.assign(vitePluginMdxOptions, {
					mdxOptions: resolvedMdxOptions,
					srcDir: config.srcDir,
				});
				vitePluginMdxOptions = {};
			},
		},
	};
}
const defaultMdxOptions = {
	extendMarkdownConfig: true,
	recmaPlugins: [],
	optimize: false,
};
function markdownConfigToMdxOptions(markdownConfig, logger) {
	return {
		...defaultMdxOptions,
		...markdownConfig,
		remarkPlugins: ignoreStringPlugins(markdownConfig.remarkPlugins, logger),
		rehypePlugins: ignoreStringPlugins(markdownConfig.rehypePlugins, logger),
		remarkRehype: markdownConfig.remarkRehype ?? {},
	};
}
function applyDefaultOptions({ options, defaults }) {
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
		optimize: options.optimize ?? defaults.optimize,
	};
}
export { mdx as default, getContainerRenderer };
