import type { SerializedStaticImage } from '../../assets/types.js';
import { getRenderCollectors } from './scope.js';

/**
 * Records that a content entry was rendered, keyed by its root-relative
 * `filePath`. No-op outside of a collecting render (dev, production SSR,
 * module top-level).
 */
export function recordContentEntryRender(filePath: string | undefined): void {
	if (!filePath) return;
	getRenderCollectors()?.contentEntries?.add(filePath);
}

/**
 * Whether the current render collects static images. `getImage()` only resolves
 * build-time image URLs when it does: the build generates exactly the images it
 * collected, so a static URL resolved outside of a collecting render would point
 * at a file that is never written.
 */
export function isCollectingStaticImages(): boolean {
	return getRenderCollectors()?.staticImages !== undefined;
}

/**
 * Records a resolved image transform, dedup hits included, preserving
 * duplicates (array push, not a set — replay depends on every record
 * arriving).
 */
export function recordStaticImage(image: SerializedStaticImage): void {
	getRenderCollectors()?.staticImages?.push(image);
}

/** Records an untransformed image reference against the active render. */
export function recordReferencedImage(fsPath: string): void {
	getRenderCollectors()?.referencedImages?.add(fsPath);
}
