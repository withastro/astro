import nodeFs from 'node:fs';
import path from 'node:path';
import { encodeHexLowerCase } from '@oslojs/encoding';

/** Subset of `node:fs` the hasher depends on, so tests can pass a fake. */
export interface LockfileHasherFs {
	readFileSync(path: string): Buffer;
}

const encoder = new TextEncoder();
const SEPARATOR = new Uint8Array([0]);

function concatBytes(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const total = parts.reduce((sum, part) => sum + part.length, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

export class LockfileHasher {
	#fs: LockfileHasherFs;

	constructor(fs: LockfileHasherFs = nodeFs) {
		this.#fs = fs;
	}

	/**
	 * Produce a sha256 over the raw bytes of the given lockfiles. Files are sorted
	 * by name so discovery order does not affect the result, and each name is mixed
	 * in so identical content under different package managers still yields distinct
	 * hashes. Returns an empty string for an empty list, letting callers treat
	 * "no lockfile" as "no signal" rather than a hash collision.
	 */
	async hash(lockfilePaths: string[]): Promise<string> {
		if (lockfilePaths.length === 0) return '';

		const sorted = [...lockfilePaths].sort((a, b) =>
			path.basename(a).localeCompare(path.basename(b)),
		);
		const parts: Uint8Array[] = [];
		for (const filePath of sorted) {
			// A NUL after each field keeps concatenation unambiguous, so distinct
			// (name, contents) pairs cannot line up into the same byte stream.
			parts.push(encoder.encode(path.basename(filePath)));
			parts.push(SEPARATOR);
			parts.push(new Uint8Array(this.#fs.readFileSync(filePath)));
			parts.push(SEPARATOR);
		}
		const digest = await crypto.subtle.digest('SHA-256', concatBytes(parts));
		return encodeHexLowerCase(new Uint8Array(digest));
	}
}
