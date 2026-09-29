import type { SerializedStaticImage } from '../../assets/types.js';
import { getRecordTarget } from './scope.js';

/**
 * Records that a content entry was rendered, keyed by its root-relative
 * `filePath`. No-op when no render is in scope (dev, production SSR,
 * `getStaticPaths`, module top-level): content entries only matter per page.
 */
export function recordContentEntryRender(filePath: string | undefined): void {
	if (!filePath) return;
	getRecordTarget()?.contentEntries?.add(filePath);
}

/**
 * Records a resolved image transform, dedup hits included, preserving
 * duplicates (array push, not a set — replay depends on every record
 * arriving). Lands in the ambient store when no render is in scope.
 */
export function recordStaticImage(image: SerializedStaticImage): void {
	getRecordTarget()?.staticImages?.push(image);
}

/**
 * Records that an image's original file is referenced outside of image
 * optimization (e.g. `<img src={img.src}>`). Lands in the ambient store when
 * no render is in scope.
 */
export function recordReferencedImage(fsPath: string): void {
	getRecordTarget()?.referencedImages?.add(fsPath);
}
