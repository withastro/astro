import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
	type AstroMarkdownOptions,
	markdownConfigDefaults,
	type PluggableList,
	type RehypePlugins,
	type RemarkPlugins,
	type RemarkRehype as RemarkRehypeOptions,
} from '@astrojs/internal-helpers/markdown';
import { satteri } from '@astrojs/markdown-satteri';
import type {
	AstroIntegration,
	AstroIntegrationLogger,
	AstroRenderer,
	ContentEntryType,
	HookParameters,
} from 'astro';
import type { MarkdownProcessor } from 'astro/markdown';
import { getContainerRenderer as getContainerRendererImpl } from './container-renderer.js';
import { isUnifiedProcessor } from './processor-guards.js';
import { safeParseFrontmatter } from './utils.js';
import { type VitePluginMdxOptions, vitePluginMdx } from './vite-plugin-mdx.js';
import { vitePluginMdxPostprocess } from './vite-plugin-mdx-postprocess.js';

/** MDX static-optimization options. Mirror of the pipeline's `OptimizeOptions`. */
export interface OptimizeOptions {
	ignoreElementNames?: string[];
}

// `gfm`/`smartypants` are deprecated and stay unset unless the user opts in; the
// MDX pipelines treat an absent value as the default (on), like the `.md` processors.
type SharedMarkdownOptions = Required<
	Pick<AstroMarkdownOptions, 'syntaxHighlight' | 'shikiConfig'>
> &
	Pick<AstroMarkdownOptions, 'gfm' | 'smartypants'>;

export type MdxOptions = SharedMarkdownOptions & {
	extendMarkdownConfig: boolean;
	/**
	 * @deprecated Pass `recmaPlugins` to `unified({ recmaPlugins })` from `@astrojs/markdown-remark` and set it as `markdown.processor` instead. Will be removed in a future major.
	 */
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
	optimize: boolean | OptimizeOptions;
};

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `addPageExtension` and `contentEntryType` are not a public APIs
	// Add type defs here
	addPageExtension: (extension: string) => void;
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/mdx/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/mdx] Importing `getContainerRenderer` from `@astrojs/mdx` is deprecated. Import it from `@astrojs/mdx/container-renderer` instead.',
	);
	return getContainerRendererImpl();
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
			'astro:config:done': async ({ config, logger }) => {
				warnDeprecatedMdxPluginOptions(partialMdxOptions, logger);

				// We resolve the final MDX options here so that other integrations have a chance to modify
				// `config.markdown` before we access it
				const extendMarkdownConfig =
					partialMdxOptions.extendMarkdownConfig ?? defaultMdxOptions.extendMarkdownConfig;

				const markdownConfig = extendMarkdownConfig ? config.markdown : markdownConfigDefaults;

				const resolvedMdxOptions = applyDefaultOptions({
					options: partialMdxOptions,
					defaults: markdownConfigToMdxOptions(markdownConfig),
				});

				// `extendMarkdownConfig: false` renders `.mdx` with a clean default processor
				// (Sätteri) instead of inheriting the site's `markdown.processor`. An explicit
				// `mdx({ processor })` always wins.
				let processor =
					partialMdxOptions.processor ??
					(extendMarkdownConfig ? config.markdown.processor : satteri());

				// Deprecated `mdx({ remark/rehypePlugins, remarkRehype })` run on the `unified`
				// processor. Wire them in by swapping to a `unified()` that carries them (per-key
				// replacing, inheriting the rest when the active processor is already `unified`),
				// mirroring how core folds `markdown.{remark,rehype}Plugins` into `unified()`.
				const hasLegacyMdxPlugins =
					(partialMdxOptions.remarkPlugins?.length ?? 0) > 0 ||
					(partialMdxOptions.rehypePlugins?.length ?? 0) > 0 ||
					(partialMdxOptions.recmaPlugins?.length ?? 0) > 0 ||
					Object.keys(partialMdxOptions.remarkRehype ?? {}).length > 0;
				if (hasLegacyMdxPlugins) {
					let unified: typeof import('@astrojs/markdown-remark').unified;
					try {
						({ unified } = await import('@astrojs/markdown-remark'));
					} catch {
						throw new Error(
							'`remarkPlugins`, `rehypePlugins`, `remarkRehype`, and `recmaPlugins` on `mdx({...})` run on the `unified` processor from `@astrojs/markdown-remark`, which is not installed. Install it with:\n  npm install @astrojs/markdown-remark',
						);
					}
					const base = isUnifiedProcessor(processor) ? processor.options : undefined;
					processor = unified({
						// MDX plugin lists are function-only; widen to the processor's plugin type.
						remarkPlugins:
							(partialMdxOptions.remarkPlugins as RemarkPlugins | undefined) ?? base?.remarkPlugins,
						rehypePlugins:
							(partialMdxOptions.rehypePlugins as RehypePlugins | undefined) ?? base?.rehypePlugins,
						remarkRehype: partialMdxOptions.remarkRehype ?? base?.remarkRehype,
						recmaPlugins: partialMdxOptions.recmaPlugins ?? base?.recmaPlugins,
						gfm: base?.gfm,
						smartypants: base?.smartypants,
					});
				}

				if (extendMarkdownConfig && isUnifiedProcessor(processor)) {
					// `gfm`/`smartypants` from `unified({...})` apply to `.mdx` too, unless
					// `mdx({...})` set its own. The processor's remark/rehype plugins are read
					// directly by its own `createMdxRenderer`, so no inheritance is needed here.
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
				// Sätteri and other processors read their own options inside `createMdxRenderer`;
				// only `unified` needs its `gfm`/`smartypants` lifted into the shared options above.

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
	const deprecated = (
		['remarkPlugins', 'rehypePlugins', 'remarkRehype', 'recmaPlugins'] as const
	).filter((key) => options[key] !== undefined);
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

function markdownConfigToMdxOptions(markdownConfig: SharedMarkdownOptions): ResolvedMdxOptions {
	return {
		...markdownConfig,
		// Deprecated `markdown.{gfm,smartypants}` may be unset (optional in the schema);
		// fall back to the processor defaults so the MDX pipeline still enables them by default.
		gfm: markdownConfig.gfm ?? markdownConfigDefaults.gfm,
		smartypants: markdownConfig.smartypants ?? markdownConfigDefaults.smartypants,
		optimize: false,
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
		optimize: options.optimize ?? defaults.optimize,
	};
}
