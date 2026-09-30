import type { UnifiedResolvedOptions } from '@astrojs/markdown-remark';
import type { MarkdownProcessor } from 'astro/markdown';

// Name-check for the built-in `unified` processor. The type-only import keeps
// `@astrojs/markdown-remark` (a dev-only dependency now that its pipeline is invoked via the
// processor) out of MDX's runtime graph.

export const isUnifiedProcessor = (p: {
	name: string;
}): p is MarkdownProcessor<UnifiedResolvedOptions> => p.name === 'unified';
