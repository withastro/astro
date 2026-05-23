import type {
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
	RehypePlugins,
	RemarkPlugins,
	RemarkRehype,
	Smartypants,
} from './types.js';

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
 * The descriptor returned by `unified()`. Integrations extend the pipeline by mutating
 * `descriptor.options.remarkPlugins` / `rehypePlugins` / `remarkRehype` directly.
 */
export interface UnifiedProcessorDescriptor {
	readonly name: 'unified';
	options: {
		remarkPlugins: RemarkPlugins;
		rehypePlugins: RehypePlugins;
		remarkRehype: RemarkRehype;
		gfm?: boolean;
		smartypants?: boolean | Smartypants;
	};
	createRenderer(shared: AstroMarkdownProcessorOptions): Promise<MarkdownProcessor>;
}

export function unified(opts: UnifiedProcessorOptions = {}): UnifiedProcessorDescriptor {
	const descriptor: UnifiedProcessorDescriptor = {
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
				remarkPlugins: descriptor.options.remarkPlugins,
				rehypePlugins: descriptor.options.rehypePlugins,
				remarkRehype: descriptor.options.remarkRehype,
				// `unified({ gfm, smartypants })` wins; fall back to the deprecated
				// top-level `markdown.gfm` / `markdown.smartypants` while they still exist.
				gfm: descriptor.options.gfm ?? shared.gfm,
				smartypants: descriptor.options.smartypants ?? shared.smartypants,
			});
		},
	};
	return descriptor;
}

export function isUnifiedProcessor(p: { name: string }): p is UnifiedProcessorDescriptor {
	return p.name === 'unified';
}
