import crypto from 'node:crypto';
import nodeFs from 'node:fs';
import path from 'node:path';

/** Subset of `node:fs` the hasher depends on, so tests can pass a fake. */
export interface LockfileHasherFs {
	readFileSync(path: string): Buffer;
}

export class LockfileHasher {
	#fs: LockfileHasherFs;

	constructor(fs: LockfileHasherFs = nodeFs) {
		this.#fs = fs;
	}

	/**
	 * Produce a sha256 over the raw bytes of the given lockfiles. Files are sorted
	 * by name so discovery order does not affect the result, and each name is mixed
	 * in so identical content under different managers still yields distinct
	 * hashes. Returns an empty string for an empty list, letting callers treat
	 * "no lockfile" as "no signal" rather than a hash collision.
	 */
	hash(lockfilePaths: string[]): string {
		if (lockfilePaths.length === 0) return '';

		const sorted = [...lockfilePaths].sort((a, b) =>
			path.basename(a).localeCompare(path.basename(b)),
		);
		const hasher = crypto.createHash('sha256');
		for (const filePath of sorted) {
			hasher.update(path.basename(filePath));
			hasher.update('\0');
			hasher.update(this.#fs.readFileSync(filePath));
			hasher.update('\0');
		}
		return hasher.digest('hex');
	}
}
