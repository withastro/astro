import type { UnifiedResolvedOptions } from '@astrojs/markdown-remark';
import type { SatteriResolvedOptions } from '@astrojs/markdown-satteri';
import type { MarkdownProcessor } from 'astro/markdown';

// Name-checks for the built-in processors. Type-only imports keep
// `@astrojs/markdown-satteri` (an optional peer) out of MDX's runtime graph.

export const isUnifiedProcessor = (p: {
	name: string;
}): p is MarkdownProcessor<UnifiedResolvedOptions> => p.name === 'unified';

export const isSatteriProcessor = (p: {
	name: string;
}): p is MarkdownProcessor<SatteriResolvedOptions> => p.name === 'satteri';
