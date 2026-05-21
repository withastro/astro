import type {
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
	RehypePlugins,
	RemarkPlugins,
	RemarkRehype,
} from '@astrojs/internal-helpers/markdown';

export interface UnifiedProcessorOptions {
	remarkPlugins?: RemarkPlugins;
	rehypePlugins?: RehypePlugins;
	remarkRehype?: RemarkRehype;
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
	};
	createRenderer(shared: AstroMarkdownProcessorOptions): Promise<MarkdownProcessor>;
}

export function unified(opts: UnifiedProcessorOptions = {}): UnifiedProcessorDescriptor {
	const descriptor: UnifiedProcessorDescriptor = {
		name: 'unified',
		options: {
			remarkPlugins: [...(opts.remarkPlugins ?? [])],
			rehypePlugins: [...(opts.rehypePlugins ?? [])],
			remarkRehype: { ...(opts.remarkRehype) },
		},
		async createRenderer(shared) {
			// Lazy import to avoid a circular module load with `./index.js`.
			const { createMarkdownProcessor } = await import('./index.js');
			return createMarkdownProcessor({
				...shared,
				remarkPlugins: descriptor.options.remarkPlugins,
				rehypePlugins: descriptor.options.rehypePlugins,
				remarkRehype: descriptor.options.remarkRehype,
			});
		},
	};
	return descriptor;
}

export function isUnifiedProcessor(p: {
	name: string;
}): p is UnifiedProcessorDescriptor {
	return p.name === 'unified';
}
