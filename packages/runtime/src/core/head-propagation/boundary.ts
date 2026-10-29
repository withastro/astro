/** Query flag marking content render entries whose head content propagates to the page. */
export const PROPAGATED_ASSET_FLAG = 'astroPropagatedAssets';

/**
 * True when a module id is a propagated-assets boundary.
 *
 * @example
 * `/src/post.mdx?astroPropagatedAssets` stops CSS graph traversal so styles
 * from one content render do not bleed into unrelated pages.
 */
export function isPropagatedAssetBoundary(id: string): boolean {
	try {
		return new URL(id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG);
	} catch {
		return false;
	}
}
