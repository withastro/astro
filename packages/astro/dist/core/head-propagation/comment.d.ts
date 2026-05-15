/**
 * Returns true when source contains the `astro-head-inject` marker comment.
 *
 * @example
 * `//! astro-head-inject` in a helper module marks parent importers as `in-tree`.
 */
export declare function hasHeadInjectComment(source: string): boolean;
