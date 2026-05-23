import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
	type AstroMarkdownProcessorOptions,
	markdownConfigDefaults,
} from '@astrojs/internal-helpers/markdown';
import type { UnifiedProcessorDescriptor } from '@astrojs/markdown-remark';

// Inlined name-check so MDX doesn't eagerly load `@astrojs/markdown-remark`
// (it's only needed when the user's active processor is `unified()`).
const isUnifiedProcessor = (p: { name: string }): p is UnifiedProcessorDescriptor =>
	p.name === 'unified';
import type {
	AstroIntegration,
	AstroIntegrationLogger,
	AstroRenderer,
	ContentEntryType,
	HookParameters,
} from 'astro';
import type { MarkdownProcessorEntry } from 'astro/markdown';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { PluggableList } from 'unified';
import { ignoreStringPlugins, safeParseFrontmatter } from './utils.js';
import { type VitePluginMdxOptions, vitePluginMdx } from './vite-plugin-mdx.js';
import { vitePluginMdxPostprocess } from './vite-plugin-mdx-postprocess.js';
import type { OptimizeOptions } from './rehype-optimize-static.js';

// `gfm`/`smartypants` are deprecated and stay unset unless the user opts in; the
// MDX pipelines treat an absent value as the default (on), like the `.md` processors.
type SharedMarkdownOptions = Required<
	Pick<AstroMarkdownProcessorOptions, 'syntaxHighlight' | 'shikiConfig'>
> &
	Pick<AstroMarkdownProcessorOptions, 'gfm' | 'smartypants'>;

export type MdxOptions = SharedMarkdownOptions & {
	extendMarkdownConfig: boolean;
	recmaPlugins: PluggableList;
	// Markdown allows strings as remark and rehype plugins.
	// This is not supported by the MDX compiler, so override types here.
	remarkPlugins: PluggableList;
	rehypePlugins: PluggableList;
	remarkRehype: RemarkRehypeOptions;
	optimize: boolean | OptimizeOptions;
	/**
	 * Override the markdown processor for `.mdx` files. Defaults to `config.markdown.processor`.
	 * Use this to run `.mdx` files through a different processor (or the same processor with
	 * different options) than your `.md` files.
	 */
	processor?: MarkdownProcessorEntry;
};

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `addPageExtension` and `contentEntryType` are not a public APIs
	// Add type defs here
	addPageExtension: (extension: string) => void;
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export function getContainerRenderer(): AstroRenderer {
	return {
		name: 'astro:jsx',
		serverEntrypoint: '@astrojs/mdx/server.js',
	};
}

export default function mdx(partialMdxOptions: Partial<MdxOptions> = {}): AstroIntegration {
	// @ts-expect-error Temporarily assign an empty object here, which will be re-assigned by the
	// `astro:config:done` hook later. This is so that `vitePluginMdx` can get hold of a reference earlier.
	let vitePluginMdxOptions: VitePluginMdxOptions = {};

	return {
		name: '@astrojs/mdx',
		hooks: {
			'astro:config:setup': async (params) => {
				const { updateConfig, config, addPageExtension, addContentEntryType, addRenderer } =
					params as SetupHookParams;

				addRenderer({
					name: 'astro:jsx',
					serverEntrypoint: new URL('../dist/server.js', import.meta.url),
				});
				addPageExtension('.mdx');
				addContentEntryType({
					extensions: ['.mdx'],
					async getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
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
				// We resolve the final MDX options here so that other integrations have a chance to modify
				// `config.markdown` before we access it
				const extendMarkdownConfig =
					partialMdxOptions.extendMarkdownConfig ?? defaultMdxOptions.extendMarkdownConfig;

				const markdownConfig = extendMarkdownConfig ? config.markdown : markdownConfigDefaults;

				const resolvedMdxOptions = applyDefaultOptions({
					options: partialMdxOptions,
					defaults: markdownConfigToMdxOptions(markdownConfig, logger),
				});

				const descriptor = partialMdxOptions.processor ?? config.markdown.processor;

				if (extendMarkdownConfig && isUnifiedProcessor(descriptor)) {
					// MDX inherits from the processor descriptor only when the user did NOT
					// pass that option to `mdx({...})`. Following the historical contract:
					// MDX's value REPLACES the markdown processor's value (no per-key merge).
					if (partialMdxOptions.remarkPlugins === undefined) {
						resolvedMdxOptions.remarkPlugins = ignoreStringPlugins(
							descriptor.options.remarkPlugins,
							logger,
						);
					}
					if (partialMdxOptions.rehypePlugins === undefined) {
						resolvedMdxOptions.rehypePlugins = ignoreStringPlugins(
							descriptor.options.rehypePlugins,
							logger,
						);
					}
					if (partialMdxOptions.remarkRehype === undefined) {
						resolvedMdxOptions.remarkRehype = { ...descriptor.options.remarkRehype };
					}
					// `gfm`/`smartypants` from `unified({...})` apply to `.mdx` too, unless
					// `mdx({...})` set its own.
					if (partialMdxOptions.gfm === undefined && descriptor.options.gfm !== undefined) {
						resolvedMdxOptions.gfm = descriptor.options.gfm;
					}
					if (
						partialMdxOptions.smartypants === undefined &&
						descriptor.options.smartypants !== undefined
					) {
						resolvedMdxOptions.smartypants = descriptor.options.smartypants;
					}
				}
				// Third-party processors don't expose their plugins to MDX's built-in option
				// merging; they handle their own pipeline via `createMdxRenderer`.

				// Mutate `mdxOptions` so that `vitePluginMdx` can reference the actual options
				Object.assign(vitePluginMdxOptions, {
					mdxOptions: resolvedMdxOptions,
					srcDir: config.srcDir,
					processor: descriptor,
				});
				// @ts-expect-error After we assign, we don't need to reference `mdxOptions` in this context anymore.
				// Re-assign it so that the garbage can be collected later.
				vitePluginMdxOptions = {};
			},
		},
	};
}

const defaultMdxOptions = {
	extendMarkdownConfig: true,
	recmaPlugins: [],
	optimize: false,
} satisfies Partial<MdxOptions>;

function markdownConfigToMdxOptions(
	markdownConfig: SharedMarkdownOptions,
	_logger: AstroIntegrationLogger,
): MdxOptions {
	return {
		...defaultMdxOptions,
		...markdownConfig,
		// Deprecated `markdown.{gfm,smartypants}` may be unset (optional in the schema);
		// fall back to the processor defaults so the MDX pipeline still enables them by default.
		gfm: markdownConfig.gfm ?? markdownConfigDefaults.gfm,
		smartypants: markdownConfig.smartypants ?? markdownConfigDefaults.smartypants,
		// Plugins come from the processor descriptor — merged in astro:config:done.
		remarkPlugins: [],
		rehypePlugins: [],
		remarkRehype: {},
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
		optimize: options.optimize ?? defaults.optimize,
	};
}
