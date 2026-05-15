import type { RehypePlugin } from '@astrojs/markdown-remark';
export interface OptimizeOptions {
	ignoreElementNames?: string[];
}
/**
 * For MDX only, collapse static subtrees of the hast into `set:html`. Subtrees
 * do not include any MDX elements.
 *
 * This optimization reduces the JS output as more content are represented as a
 * string instead, which also reduces the AST size that Rollup holds in memory.
 */
export declare const rehypeOptimizeStatic: RehypePlugin<[OptimizeOptions?]>;
