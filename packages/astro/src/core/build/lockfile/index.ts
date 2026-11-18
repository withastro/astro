import nodeFs from 'node:fs';
import { LockfileFinder } from './finder.js';
import { LockfileHasher } from './hasher.js';

export { KNOWN_LOCKFILES, LockfileFinder, type LockfileFinderFs } from './finder.js';
export { LockfileHasher, type LockfileHasherFs } from './hasher.js';

/**
 * Find the nearest lockfiles at or above `startDir` and hash them into a single
 * digest used to globally invalidate the incremental build cache when
 * dependencies change. Returns an empty string when no lockfile is found.
 */
export function computeLockfileHash(startDir: string, fs: typeof nodeFs = nodeFs): Promise<string> {
	const finder = new LockfileFinder(fs);
	const hasher = new LockfileHasher(fs);
	return hasher.hash(finder.find(startDir));
}
