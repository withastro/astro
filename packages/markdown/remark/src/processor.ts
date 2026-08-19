import type {
	MarkdownProcessor,
	RehypePlugins,
	RemarkPlugins,
	RemarkRehype,
	Smartypants,
} from '@astrojs/internal-helpers/markdown';

export interface UnifiedProcessorOptions {
	remarkPlugins?: RemarkPlugins;
	rehypePlugins?: RehypePlugins;
	remarkRehype?: RemarkRehype;
	/** Enable GitHub-Flavored Markdown. Defaults to `true`. */
	gfm?: boolean;
	/** Enable SmartyPants typography. Defaults to `true`; pass an object to configure it. */
	smartypants?: boolean | Smartypants;
}

/**
 * Resolved options on the processor returned by `unified()`. Always populated
 * (the factory normalises absent inputs into defaults).
 */
export interface UnifiedResolvedOptions {
	remarkPlugins: RemarkPlugins;
	rehypePlugins: RehypePlugins;
	remarkRehype: RemarkRehype;
	gfm?: boolean;
	smartypants?: boolean | Smartypants;
}

/**
 * Use the default remark/rehype-based Markdown processor for `markdown.processor`.
 * Extend the pipeline with remark or rehype plugins, or pass options to `remark-rehype`.
 *
 * ```js
 * import { unified } from '@astrojs/markdown-remark';
 * import remarkToc from 'remark-toc';
 *
 * export default defineConfig({
 *   markdown: {
 *     processor: unified({ remarkPlugins: [remarkToc] }),
 *   },
 * });
 * ```
 */
export function unified(
	opts: UnifiedProcessorOptions = {},
): MarkdownProcessor<UnifiedResolvedOptions> {
	const processor: MarkdownProcessor<UnifiedResolvedOptions> = {
		name: 'unified',
		options: {
			remarkPlugins: [...(opts.remarkPlugins ?? [])],
			rehypePlugins: [...(opts.rehypePlugins ?? [])],
			remarkRehype: { ...opts.remarkRehype },
			gfm: opts.gfm,
			smartypants: opts.smartypants,
		},
		async createRenderer(shared) {
			// Lazy import to avoid a circular module load with `./index.js`.
			const { createMarkdownProcessor } = await import('./index.js');
			return createMarkdownProcessor({
				...shared,
				remarkPlugins: processor.options.remarkPlugins,
				rehypePlugins: processor.options.rehypePlugins,
				remarkRehype: processor.options.remarkRehype,
				// `unified({ gfm, smartypants })` wins; fall back to the deprecated
				// top-level `markdown.gfm` / `markdown.smartypants` while they still exist.
				gfm: processor.options.gfm ?? shared.gfm,
				smartypants: processor.options.smartypants ?? shared.smartypants,
			});
		},
	};
	return processor;
}

export function isUnifiedProcessor(p: {
	name: string;
}): p is MarkdownProcessor<UnifiedResolvedOptions> {
	return p.name === 'unified';
}
