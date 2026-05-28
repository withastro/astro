import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
	type AstroMarkdownOptions,
	markdownConfigDefaults,
} from '@astrojs/internal-helpers/markdown';
import type {
	AstroIntegration,
	AstroIntegrationLogger,
	AstroRenderer,
	ContentEntryType,
	HookParameters,
} from 'astro';
import type { MarkdownProcessor } from 'astro/markdown';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { PluggableList } from 'unified';
import { isSatteriProcessor, isUnifiedProcessor } from './processor-guards.js';
import type { OptimizeOptions } from './rehype-optimize-static.js';
import { ignoreStringPlugins, safeParseFrontmatter } from './utils.js';
import { type VitePluginMdxOptions, vitePluginMdx } from './vite-plugin-mdx.js';
import { vitePluginMdxPostprocess } from './vite-plugin-mdx-postprocess.js';

// `gfm`/`smartypants` are deprecated and stay unset unless the user opts in; the
// MDX pipelines treat an absent value as the default (on), like the `.md` processors.
type SharedMarkdownOptions = Required<
	Pick<AstroMarkdownOptions, 'syntaxHighlight' | 'shikiConfig'>
> &
	Pick<AstroMarkdownOptions, 'gfm' | 'smartypants'>;

export type MdxOptions = SharedMarkdownOptions & {
	extendMarkdownConfig: boolean;
	recmaPlugins: PluggableList;
	optimize: boolean | OptimizeOptions;
	/**
	 * Override the markdown processor for `.mdx` files. Defaults to `config.markdown.processor`.
	 * Use this to run `.mdx` files through a different processor (or the same processor with
	 * different options) than your `.md` files.
	 */
	processor?: MarkdownProcessor;
	// Markdown allows strings as remark and rehype plugins.
	// This is not supported by the MDX compiler, so override types here.
	/**
	 * @deprecated Pass `remarkPlugins` to `unified({ remarkPlugins })` from `@astrojs/markdown-remark` and set it as `markdown.processor` instead — MDX will inherit them. Will be removed in a future major.
	 */
	remarkPlugins: PluggableList;
	/**
	 * @deprecated Pass `rehypePlugins` to `unified({ rehypePlugins })` from `@astrojs/markdown-remark` and set it as `markdown.processor` instead — MDX will inherit them. Will be removed in a future major.
	 */
	rehypePlugins: PluggableList;
	/**
	 * @deprecated Pass `remarkRehype` to `unified({ remarkRehype })` from `@astrojs/markdown-remark` and set it as `markdown.processor` instead — MDX will inherit it. Will be removed in a future major.
	 */
	remarkRehype: RemarkRehypeOptions;
};

/**
 * MDX pipeline options. Excludes user-only control fields (`extendMarkdownConfig`, `processor`).
 * @internal
 */
export type ResolvedMdxOptions = SharedMarkdownOptions & {
	recmaPlugins: PluggableList;
	optimize: boolean | OptimizeOptions;
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
				warnDeprecatedMdxPluginOptions(partialMdxOptions, logger);

				// We resolve the final MDX options here so that other integrations have a chance to modify
				// `config.markdown` before we access it
				const extendMarkdownConfig =
					partialMdxOptions.extendMarkdownConfig ?? defaultMdxOptions.extendMarkdownConfig;

				const markdownConfig = extendMarkdownConfig ? config.markdown : markdownConfigDefaults;

				const resolvedMdxOptions = applyDefaultOptions({
					options: partialMdxOptions,
					defaults: markdownConfigToMdxOptions(markdownConfig, logger),
				});

				const processor = partialMdxOptions.processor ?? config.markdown.processor;

				if (extendMarkdownConfig && isUnifiedProcessor(processor)) {
					// MDX inherits from the processor only when the user did NOT pass that option
					// to `mdx({...})`. Following the historical contract: MDX's value REPLACES the
					// markdown processor's value (no per-key merge).
					if (partialMdxOptions.remarkPlugins === undefined) {
						resolvedMdxOptions.remarkPlugins = ignoreStringPlugins(
							processor.options.remarkPlugins,
							logger,
						);
					}
					if (partialMdxOptions.rehypePlugins === undefined) {
						resolvedMdxOptions.rehypePlugins = ignoreStringPlugins(
							processor.options.rehypePlugins,
							logger,
						);
					}
					if (partialMdxOptions.remarkRehype === undefined) {
						resolvedMdxOptions.remarkRehype = { ...processor.options.remarkRehype };
					}
					// `gfm`/`smartypants` from `unified({...})` apply to `.mdx` too, unless
					// `mdx({...})` set its own.
					if (partialMdxOptions.gfm === undefined && processor.options.gfm !== undefined) {
						resolvedMdxOptions.gfm = processor.options.gfm;
					}
					if (
						partialMdxOptions.smartypants === undefined &&
						processor.options.smartypants !== undefined
					) {
						resolvedMdxOptions.smartypants = processor.options.smartypants;
					}
				}
				if (extendMarkdownConfig && isSatteriProcessor(processor)) {
					// `gfm`/`smartPunctuation` from `satteri({ features: {...} })` apply to `.mdx`
					// too, unless `mdx({...})` set its own. Mirrors the unified branch above.
					const features = processor.options.features;
					if (partialMdxOptions.gfm === undefined && features.gfm !== undefined) {
						resolvedMdxOptions.gfm = features.gfm;
					}
					// `smartPunctuation` can be `boolean | SmartPunctuationOptions`; only the boolean
					// form is shape-compatible with `mdxOptions.smartypants`. Object configs stay on
					// the processor and are applied at the satteri/mdx boundary.
					if (
						partialMdxOptions.smartypants === undefined &&
						typeof features.smartPunctuation === 'boolean'
					) {
						resolvedMdxOptions.smartypants = features.smartPunctuation;
					}
				}
				// Other third-party processors handle their own pipeline via `createMdxRenderer`.

				// Mutate `mdxOptions` so that `vitePluginMdx` can reference the actual options
				Object.assign(vitePluginMdxOptions, {
					mdxOptions: resolvedMdxOptions,
					srcDir: config.srcDir,
					processor,
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
} satisfies Partial<MdxOptions>;

let didWarnAboutDeprecatedMdxPluginOptions = false;

function warnDeprecatedMdxPluginOptions(
	options: Partial<MdxOptions>,
	logger: AstroIntegrationLogger,
): void {
	if (didWarnAboutDeprecatedMdxPluginOptions) return;
	const deprecated = (['remarkPlugins', 'rehypePlugins', 'remarkRehype'] as const).filter(
		(key) => options[key] !== undefined,
	);
	if (deprecated.length === 0) return;
	didWarnAboutDeprecatedMdxPluginOptions = true;

	const names = deprecated.map((key) => `\`${key}\``).join(', ');
	const isPlural = deprecated.length > 1;
	logger.warn(
		`${names} on \`mdx({...})\` ${isPlural ? 'are' : 'is'} deprecated. ` +
			`Pass ${isPlural ? 'them' : 'it'} to \`unified({...})\` from \`@astrojs/markdown-remark\` ` +
			`and set it as \`markdown.processor\` instead — MDX will inherit ${isPlural ? 'them' : 'it'}. ` +
			'Will be removed in a future major.',
	);
}

function markdownConfigToMdxOptions(
	markdownConfig: SharedMarkdownOptions,
	_logger: AstroIntegrationLogger,
): ResolvedMdxOptions {
	return {
		...markdownConfig,
		// Deprecated `markdown.{gfm,smartypants}` may be unset (optional in the schema);
		// fall back to the processor defaults so the MDX pipeline still enables them by default.
		gfm: markdownConfig.gfm ?? markdownConfigDefaults.gfm,
		smartypants: markdownConfig.smartypants ?? markdownConfigDefaults.smartypants,
		recmaPlugins: [],
		optimize: false,
		// Plugins come from the processor — merged in astro:config:done.
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
	defaults: ResolvedMdxOptions;
}): ResolvedMdxOptions {
	return {
		syntaxHighlight: options.syntaxHighlight ?? defaults.syntaxHighlight,
		shikiConfig: options.shikiConfig ?? defaults.shikiConfig,
		gfm: options.gfm ?? defaults.gfm,
		smartypants: options.smartypants ?? defaults.smartypants,
		recmaPlugins: options.recmaPlugins ?? defaults.recmaPlugins,
		optimize: options.optimize ?? defaults.optimize,
		remarkPlugins: options.remarkPlugins ?? defaults.remarkPlugins,
		rehypePlugins: options.rehypePlugins ?? defaults.rehypePlugins,
		remarkRehype: options.remarkRehype ?? defaults.remarkRehype,
	};
}
