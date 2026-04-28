// Detect this in comments, both in .astro components and in js/ts files.
// Keep behavior aligned with the existing plugin usage.
const HEAD_INJECT_COMMENT_EXP = /(?:^\/\/|\/\/!)\s*astro-head-inject/;

/**
 * Returns true when source contains the `astro-head-inject` marker comment.
 *
 * @example
 * `//! astro-head-inject` in a helper module marks parent importers as `in-tree`.
 */
export function hasHeadInjectComment(source: string): boolean {
	return HEAD_INJECT_COMMENT_EXP.test(source);
}
