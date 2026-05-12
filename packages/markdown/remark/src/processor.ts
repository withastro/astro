import type {
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
	RehypePlugins,
	RemarkPlugins,
	RemarkRehype,
} from './types.js';

export interface UnifiedProcessorOptions {
	remarkPlugins?: RemarkPlugins;
	rehypePlugins?: RehypePlugins;
	remarkRehype?: RemarkRehype;
}

/**
 * The descriptor returned by `unified()`. Implements `MarkdownProcessorEntry` (astro core's
 * pluggable processor interface) and additionally exposes the remark/rehype plugin lists
 * so the MDX integration can merge them into MDX options.
 */
export interface UnifiedProcessorDescriptor {
	readonly name: 'unified';
	remarkPlugins: RemarkPlugins;
	rehypePlugins: RehypePlugins;
	remarkRehype: RemarkRehype;
	createRenderer(shared: AstroMarkdownProcessorOptions): Promise<MarkdownProcessor>;
}

export function unified(opts: UnifiedProcessorOptions = {}): UnifiedProcessorDescriptor {
	const remarkPlugins = opts.remarkPlugins ?? [];
	const rehypePlugins = opts.rehypePlugins ?? [];
	const remarkRehype = opts.remarkRehype ?? {};

	return {
		name: 'unified',
		remarkPlugins,
		rehypePlugins,
		remarkRehype,
		async createRenderer(shared) {
			// Lazy import to avoid a circular module load with `./index.js`.
			const { createMarkdownProcessor } = await import('./index.js');
			return createMarkdownProcessor({
				...shared,
				remarkPlugins,
				rehypePlugins,
				remarkRehype,
			});
		},
	};
}

export function isUnifiedProcessor(p: {
	name: string;
}): p is UnifiedProcessorDescriptor {
	return p.name === 'unified';
}
