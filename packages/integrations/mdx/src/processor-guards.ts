import type { UnifiedResolvedOptions } from '@astrojs/markdown-remark';
import type { MarkdownProcessor } from 'astro/markdown';

// Name-checks for the built-in processor. Type-only imports keep
// `@astrojs/markdown-remark` out of MDX's eagerly-loaded runtime graph.

export const isUnifiedProcessor = (
	p: { name: string },
): p is MarkdownProcessor<UnifiedResolvedOptions> => p.name === 'unified';
