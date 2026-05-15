/**
 * True when a module id is a propagated-assets boundary.
 *
 * @example
 * `/src/post.mdx?astroPropagatedAssets` stops CSS graph traversal so styles
 * from one content render do not bleed into unrelated pages.
 */
export declare function isPropagatedAssetBoundary(id: string): boolean;
