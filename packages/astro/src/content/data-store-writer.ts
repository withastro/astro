import { promises as fs, type PathLike } from 'node:fs';
import * as devalue from 'devalue';
import xxhash, { type XXHashAPI } from 'xxhash-wasm';
import { emptyDir } from '../core/fs/index.js';
import { DATA_STORE_MANIFEST_FILE } from './consts.js';

/** A chunked store manifest: each collection maps to its content-addressed part files. */
export type DataStoreManifest = Record<string, string[]>;

/**
 * Persists the content collection data produced by the content layer. This is
 * the write side that saves the data; {@link import('./data-store-source.js').DataStoreSource}
 * is the read side that loads it back. Implementations run in Node.js
 * (build/dev) and are never imported at runtime.
 */
export interface DataStoreWriter {
	/**
	 * Serialize and persist the given collections.
	 * Resolves to `true` if the data on disk changed, or `false` if the write
	 * was skipped because the persisted data was already identical.
	 */
	write(collections: Map<string, Map<string, any>>): Promise<boolean>;
	/**
	 * The file whose write commits a store update: the store file itself, or
	 * the manifest for chunked stores.
	 */
	readonly target: PathLike;
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
 * Finds the end of the largest UTF-8-safe slice beginning at `startIndex` that
 * fits within `maxBytes`. A code point larger than `maxBytes` is returned on
 * its own so callers always make progress.
 */
function getChunkEnd(str: string, startIndex: number, maxBytes: number) {
	let index = startIndex;
	let bytes = 0;
	while (index < str.length) {
		const codePoint = str.codePointAt(index)!;
		const charLength = codePoint > 0xffff ? 2 : 1;
		const charBytes = ENCODER.encode(str.slice(index, index + charLength)).length;
		if (bytes + charBytes > maxBytes && index > startIndex) {
			break;
		}
		index += charLength;
		bytes += charBytes;
		if (bytes >= maxBytes) {
			break;
		}
	}
	return { endIndex: index, bytes };
}

/**
 * Split a string into parts each at most `maxBytes` UTF-8 bytes, never splitting
 * a Unicode code point across parts.
 *
 * The store is serialized with devalue and written to disk as UTF-8. Splitting
 * on UTF-16 code-unit boundaries (e.g. `String.prototype.slice`) can cut a
 * surrogate pair in half; encoding a lone surrogate to UTF-8 substitutes U+FFFD,
 * so concatenating the re-read parts would corrupt any astral-plane character
 * (emoji, some CJK, etc.). `getChunkEnd()` advances by Unicode code point, so
 * `str.slice` is only ever called on code-point boundaries and the parts always
 * rejoin to the exact original string.
 */
export function chunkString(str: string, maxBytes: number): string[] {
	const chunks: string[] = [];
	let startIndex = 0;
	while (startIndex < str.length) {
		const { endIndex } = getChunkEnd(str, startIndex, maxBytes);
		chunks.push(str.slice(startIndex, endIndex));
		startIndex = endIndex;
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
 *
 * Returns `true` if the file was written, or `false` if the write was skipped.
 */
export async function writeFileAtomic(file: PathLike, data: string): Promise<boolean> {
	const tempFile = file instanceof URL ? new URL(`${file.href}.tmp`) : `${file}.tmp`;
	const oldData = await fs.readFile(file, 'utf-8').catch(() => '');
	if (oldData === data) {
		// If the data hasn't changed, we can skip the write.
		return false;
	}
	// Write to a temporary file first and then move it to prevent partial reads.
	await fs.writeFile(tempFile, data);
	await fs.rename(tempFile, file);
	return true;
}

/**
 * A {@link DataStoreWriter} that serializes the whole store to a single file.
 */
export class FileWriter implements DataStoreWriter {
	#file: PathLike;

	constructor(file: PathLike) {
		this.#file = file;
	}

	get target(): PathLike {
		return this.#file;
	}

	async write(collections: Map<string, Map<string, any>>): Promise<boolean> {
		return await writeFileAtomic(this.#file, serializeDataStore(collections));
	}
}

/**
 * A {@link DataStoreWriter} that splits the store across many content-addressed
 * files inside a directory, described by a manifest.
 *
 * Entries are serialized independently into parts no larger than a fixed byte
 * size, so writing a collection does not require a collection-wide serialized
 * string. Each part file is named by the xxhash of its contents, so unchanged
 * parts keep the same name across builds and their writes are skipped, and two
 * identical parts are naturally deduplicated. The manifest is written last as
 * the commit point, and stale files are pruned afterwards. This is the inverse
 * of {@link import('./data-store.js').ImmutableDataStore.manifestToMap}.
 */
export class ChunkedWriter implements DataStoreWriter {
	#dir: URL;
	#manifestFile: URL;
	#chunkSize: number;
	#hasher?: XXHashAPI;
	#writtenFiles = new Set<string>();

	constructor(dir: URL, chunkSize: number) {
		this.#dir = dir;
		this.#manifestFile = new URL(`./${DATA_STORE_MANIFEST_FILE}`, dir);
		this.#chunkSize = chunkSize;
	}

	get target(): PathLike {
		return this.#manifestFile;
	}

	async write(collections: Map<string, Map<string, any>>): Promise<boolean> {
		if (!this.#hasher) {
			this.#hasher = await xxhash();
		}

		this.#writtenFiles = new Set();
		const manifest: DataStoreManifest = {};

		for (const [collectionName, entries] of sortCollections(collections)) {
			manifest[collectionName] = await this.#writeCollection(entries);
		}

		// The manifest is the commit point: every part it references already
		// exists on disk, so a reader never sees a dangling reference. Parts are
		// content-addressed, so an unchanged manifest means unchanged data.
		const didWrite = await writeFileAtomic(this.#manifestFile, JSON.stringify(manifest));
		this.#writtenFiles.add(DATA_STORE_MANIFEST_FILE);

		// Prune files left behind by previous snapshots.
		emptyDir(this.#dir, this.#writtenFiles);
		return didWrite;
	}

	async #writeCollection(entries: Iterable<[string, unknown]>) {
		const parts: string[] = [];
		let chunk = '';
		let chunkBytes = 0;

		const writeChunk = async () => {
			const fileName = `${this.#hasher!.h64ToString(chunk)}.txt`;
			await writeFileAtomic(new URL(`./${fileName}`, this.#dir), chunk);
			parts.push(fileName);
			this.#writtenFiles.add(fileName);
			chunk = '';
			chunkBytes = 0;
		};

		for (const [id, entry] of entries) {
			const serialized = `${devalue.stringify([id, entry])}\n`;
			let startIndex = 0;

			while (startIndex < serialized.length) {
				const { endIndex, bytes } = getChunkEnd(
					serialized,
					startIndex,
					this.#chunkSize - chunkBytes,
				);
				chunk += serialized.slice(startIndex, endIndex);
				chunkBytes += bytes;
				startIndex = endIndex;

				if (chunkBytes >= this.#chunkSize) {
					await writeChunk();
				}
			}
		}

		if (chunk) {
			await writeChunk();
		}

		return parts;
	}
}
