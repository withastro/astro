import type {
	AstroMarkdownOptions,
	MdxRenderer,
	MdxRendererOptions,
} from '@astrojs/internal-helpers/markdown';
import type { UnifiedResolvedOptions } from '../processor.js';

// Browser counterpart of `create-processor.ts`. MDX compilation relies on Node-only
// APIs (`@mdx-js/mdx`, `node:fs`, …), so it is unavailable in browser/edge bundles.
export function createUnifiedMdxProcessor(
	_shared: AstroMarkdownOptions,
	_mdx: MdxRendererOptions,
	_options: UnifiedResolvedOptions,
): MdxRenderer {
	throw new Error(
		'MDX compilation is not available in the browser build of `@astrojs/markdown-remark`.',
	);
}
