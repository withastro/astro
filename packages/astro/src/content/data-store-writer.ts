import { promises as fs, type PathLike } from 'node:fs';
import * as devalue from 'devalue';

/**
 * Persists the content collection data produced by the content layer. This is
 * the producer-side seam that mirrors {@link import('./data-store-source.js').DataStoreSource}
 * on the consumer side. Implementations run in Node.js (build/dev) and are
 * never imported at runtime.
 */
export interface DataStoreWriter {
	/** Serialize and persist the given collections. */
	write(collections: Map<string, Map<string, any>>): Promise<void>;
}

/**
 * Serialize collections to a deterministic devalue string.
 *
 * Collections and their entries are sorted by key so the output is stable
 * regardless of the order entries were processed in. Entry insertion order can
 * vary between builds due to concurrent file processing (pLimit), so sorting
 * here guarantees stable output hashes regardless of processing order.
 */
export function serializeDataStore(collections: Map<string, Map<string, any>>): string {
	const sorted = new Map(
		[...collections.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, collection]) => [
				key,
				new Map([...collection.entries()].sort(([a], [b]) => a.localeCompare(b))),
			]),
	);
	return devalue.stringify(sorted);
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
