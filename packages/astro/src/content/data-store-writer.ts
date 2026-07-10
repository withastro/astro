import { promises as fs, type PathLike } from 'node:fs';
import * as devalue from 'devalue';
import xxhash, { type XXHashAPI } from 'xxhash-wasm';
import { emptyDir } from '../core/fs/index.js';
import { DATA_STORE_MANIFEST_FILE } from './consts.js';

/** Maximum size, in UTF-8 bytes, of a single part file. */
const CHUNK_SIZE_LIMIT = 20 * 1024 * 1024; // 20 MB

/**
 * A chunked store manifest: each collection maps to the list of part file names
 * whose contents concatenate back into that collection's serialized string.
 */
export type DataStoreManifest = Record<string, string[]>;

/**
 * Persists the content collection data produced by the content layer. This is
 * the write side that saves the data; {@link import('./data-store-source.js').DataStoreSource}
 * is the read side that loads it back. Implementations run in Node.js
 * (build/dev) and are never imported at runtime.
 */
export interface DataStoreWriter {
	/** Serialize and persist the given collections. */
	write(collections: Map<string, Map<string, any>>): Promise<void>;
}

/**
 * Sort collections and their entries by key.
 *
 * Entry insertion order can vary between builds due to concurrent file
 * processing (pLimit), so sorting here guarantees stable output regardless of
 * processing order. Stable output keeps serialized strings (and the content
 * hashes derived from them) deterministic across builds.
 */
function sortCollections(
	collections: Map<string, Map<string, any>>,
): Map<string, Map<string, any>> {
	return new Map(
		[...collections.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, collection]) => [
				key,
				new Map([...collection.entries()].sort(([a], [b]) => a.localeCompare(b))),
			]),
	);
}

/**
 * Serialize collections to a deterministic devalue string.
 */
export function serializeDataStore(collections: Map<string, Map<string, any>>): string {
	return devalue.stringify(sortCollections(collections));
}

const ENCODER = new TextEncoder();

/**
 * Split a string into parts each at most `maxBytes` UTF-8 bytes, never splitting
 * a Unicode code point across parts.
 *
 * The store is serialized with devalue and written to disk as UTF-8. Splitting
 * on UTF-16 code-unit boundaries (e.g. `String.prototype.slice`) can cut a
 * surrogate pair in half; encoding a lone surrogate to UTF-8 substitutes U+FFFD,
 * so concatenating the re-read parts would corrupt any astral-plane character
 * (emoji, some CJK, etc.). Iterating with `for...of` yields whole code points,
 * so `str.slice` is only ever called on code-point boundaries and the parts
 * always rejoin to the exact original string.
 */
export function chunkString(str: string, maxBytes: number): string[] {
	const chunks: string[] = [];
	let startIndex = 0; // UTF-16 index where the current part starts
	let index = 0; // current UTF-16 index (always on a code-point boundary)
	let currentBytes = 0;
	for (const char of str) {
		const charBytes = ENCODER.encode(char).length;
		// Close the current part before it would exceed the byte limit, but never
		// emit an empty part (guards against a single code point over the limit).
		if (currentBytes + charBytes > maxBytes && index > startIndex) {
			chunks.push(str.slice(startIndex, index));
			startIndex = index;
			currentBytes = 0;
		}
		index += char.length; // 1 for BMP, 2 for a surrogate pair
		currentBytes += charBytes;
	}
	if (startIndex < str.length) {
		chunks.push(str.slice(startIndex));
	}
	return chunks;
}

/**
 * Atomically write `data` to `file`.
 *
 * The data is written to a temporary file and then renamed into place to avoid
 * partial reads. If the file already contains identical data, the write is
 * skipped. Callers are responsible for serializing concurrent writes to the
 * same file.
 */
export async function writeFileAtomic(file: PathLike, data: string): Promise<void> {
	const tempFile = file instanceof URL ? new URL(`${file.href}.tmp`) : `${file}.tmp`;
	const oldData = await fs.readFile(file, 'utf-8').catch(() => '');
	if (oldData === data) {
		// If the data hasn't changed, we can skip the write.
		return;
	}
	// Write to a temporary file first and then move it to prevent partial reads.
	await fs.writeFile(tempFile, data);
	await fs.rename(tempFile, file);
}

/**
 * A {@link DataStoreWriter} that serializes the whole store to a single file.
 */
export class FileWriter implements DataStoreWriter {
	#file: PathLike;

	constructor(file: PathLike) {
		this.#file = file;
	}

	async write(collections: Map<string, Map<string, any>>): Promise<void> {
		await writeFileAtomic(this.#file, serializeDataStore(collections));
	}
}

/**
 * A {@link DataStoreWriter} that splits the store across many content-addressed
 * files inside a directory, described by a manifest.
 *
 * Each collection is serialized to a string and split into parts no larger than
 * a fixed byte size, so no single file grows unbounded (platform file-size
 * limits). Each part file is named by the xxhash of its contents, so unchanged
 * parts keep the same name across builds and their writes are skipped, and two
 * identical parts are naturally deduplicated. The manifest is written last as
 * the commit point, and stale files are pruned afterwards. This is the inverse
 * of {@link import('./data-store.js').ImmutableDataStore.manifestToMap}.
 */
export class ChunkedWriter implements DataStoreWriter {
	#dir: URL;
	#manifestFile: URL;
	#hasher?: XXHashAPI;

	constructor(dir: URL) {
		this.#dir = dir;
		this.#manifestFile = new URL(`./${DATA_STORE_MANIFEST_FILE}`, dir);
	}

	async write(collections: Map<string, Map<string, any>>): Promise<void> {
		if (!this.#hasher) {
			this.#hasher = await xxhash();
		}
		const { h64ToString } = this.#hasher;

		// Track every file this snapshot references so the rest can be pruned.
		const writtenFiles = new Set<string>();
		const manifest: DataStoreManifest = {};

		// Sorted iteration keeps file names deterministic across builds.
		for (const [collectionName, entries] of sortCollections(collections)) {
			const stringified = devalue.stringify(entries);
			// Split the serialized collection so no single file grows unbounded.
			const parts: string[] = [];
			for (const part of chunkString(stringified, CHUNK_SIZE_LIMIT)) {
				const fileName = `${h64ToString(part)}.txt`;
				await writeFileAtomic(new URL(`./${fileName}`, this.#dir), part);
				parts.push(fileName);
				writtenFiles.add(fileName);
			}
			manifest[collectionName] = parts;
		}

		// The manifest is the commit point: every part it references already
		// exists on disk, so a reader never sees a dangling reference.
		await writeFileAtomic(this.#manifestFile, JSON.stringify(manifest));
		writtenFiles.add(DATA_STORE_MANIFEST_FILE);

		// Prune files left behind by previous snapshots.
		emptyDir(this.#dir, writtenFiles);
	}
}
