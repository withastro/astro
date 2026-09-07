import type { SerializedStaticImage } from '../../assets/types.js';
import { getInstalledRenderScope } from './scope.js';

/**
 * Records that a content entry was rendered, keyed by its root-relative
 * `filePath`. No-op when no scope is installed (dev, production SSR,
 * non-incremental builds) or no render is in scope (`getStaticPaths`, module
 * top-level).
 */
export function recordContentEntryRender(filePath: string | undefined): void {
	if (!filePath) return;
	getInstalledRenderScope()?.getStore()?.contentEntries?.add(filePath);
}

/**
 * Records a resolved image transform, dedup hits included, preserving
 * duplicates (array push, not a set — replay depends on every record
 * arriving).
 */
export function recordStaticImage(image: SerializedStaticImage): void {
	getInstalledRenderScope()?.getStore()?.staticImages?.push(image);
}
