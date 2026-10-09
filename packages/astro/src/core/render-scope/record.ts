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
 * Whether static images are collected in the current context: during a build,
 * by the current render or, outside of one, by the build itself. `getImage()`
 * only resolves build-time image URLs when they are: the build generates exactly
 * the images it collected, so a static URL resolved anywhere else (dev, SSR, a
 * prerenderer opting out) would point at a file that is never written.
 */
export function isCollectingStaticImages(): boolean {
	return getRenderCollectors()?.staticImages !== undefined;
}

/**
 * Records a resolved image transform against the active render, including repeats of the
 * same transform. `collectPrerenderMetadata()` dedupes them in the page's metadata.
 */
export function recordStaticImage(image: SerializedStaticImage): void {
	getRenderCollectors()?.staticImages?.push(image);
}

/** Records an untransformed image reference against the active render. */
export function recordReferencedImage(fsPath: string): void {
	getRenderCollectors()?.referencedImages?.add(fsPath);
}
