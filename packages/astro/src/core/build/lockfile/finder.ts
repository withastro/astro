import nodeFs from 'node:fs';
import path from 'node:path';

/**
 * Lockfile names recognized across the package managers we support. A project
 * can commit more than one, so these carry no priority: every match in a
 * directory is returned.
 */
export const KNOWN_LOCKFILES = [
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
	'bun.lock',
	'bun.lockb',
] as const;

/** Subset of `node:fs` the finder depends on, so tests can pass a fake. */
export interface LockfileFinderFs {
	existsSync(path: string): boolean;
}

export class LockfileFinder {
	#fs: LockfileFinderFs;
	#lockfileNames: readonly string[];

	constructor(fs: LockfileFinderFs = nodeFs, lockfileNames: readonly string[] = KNOWN_LOCKFILES) {
		this.#fs = fs;
		this.#lockfileNames = lockfileNames;
	}

	/**
	 * Walk upward from `startDir` and return the absolute paths of every known
	 * lockfile in the first directory that contains at least one. In a workspace
	 * the lockfile lives above the individual project, so the walk continues until
	 * a directory yields a match. Returns an empty array if the filesystem root is
	 * reached without finding one.
	 */
	find(startDir: string): string[] {
		let dir = path.resolve(startDir);
		// `path.dirname` of the filesystem root returns the root unchanged, so once
		// the parent stops moving we have checked every level up to and including it.
		let previous = '';
		while (dir !== previous) {
			const found: string[] = [];
			for (const name of this.#lockfileNames) {
				const candidate = path.join(dir, name);
				if (this.#fs.existsSync(candidate)) {
					found.push(candidate);
				}
			}
			if (found.length > 0) return found;

			previous = dir;
			dir = path.dirname(dir);
		}
		return [];
	}
}
