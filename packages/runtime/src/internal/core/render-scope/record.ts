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

export function isCollectingStaticImages(): boolean {
	return getRenderCollectors()?.staticImages !== undefined;
}

/** Keeps repeats; `collectPrerenderMetadata()` dedupes them. */
export function recordStaticImage(image: SerializedStaticImage): void {
	getRenderCollectors()?.staticImages?.push(image);
}

/** Records an untransformed image reference against the active render. */
export function recordReferencedImage(fsPath: string): void {
	getRenderCollectors()?.referencedImages?.add(fsPath);
}
