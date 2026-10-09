import { forEach } from 'neotraverse';
import { IMAGE_IMPORT_PREFIX } from './consts.js';
import type { DataEntry } from './data-store.js';

/**
 * Builds the entry that a store persists for a loader's `store.set()` call, with `id` as its ID.
 *
 * Image fields that the `image()` schema helper prefixed are recorded in `imageImports` and
 * `assetImports`, and their prefix is removed from `data` in place. Optional fields are only
 * set when they have a value.
 *
 * @throws When `filePath` is absolute.
 */
export function createDataEntry(
	id: string,
	{
		data,
		body,
		filePath,
		deferredRender,
		digest,
		rendered,
		assetImports,
		imageImports: incomingImageImports,
	}: DataEntry,
): DataEntry {
	const foundAssets = new Set<string>(assetImports);
	const imageImports: (string | number)[][] = [];
	const seenImageImportPaths = new Set();
	const recordImageImport = (imagePath: (string | number)[]) => {
		const pathKey = JSON.stringify(imagePath);
		if (seenImageImportPaths.has(pathKey)) {
			return;
		}
		seenImageImportPaths.add(pathKey);
		imageImports.push(imagePath);
	};
	for (const existingImagePath of incomingImageImports ?? []) {
		recordImageImport([...existingImagePath]);
	}
	// Image fields are prefixed during schema parsing. Record their locations and
	// strip the prefix so the stored data holds a plain, devalue-serializable src
	// string. The recorded paths let read-time resolution rewrite only these fields
	// without traversing or cloning the rest of the data.
	forEach(data, function (ctx, val) {
		if (typeof val === 'string' && val.startsWith(IMAGE_IMPORT_PREFIX)) {
			const src = val.replace(IMAGE_IMPORT_PREFIX, '');
			foundAssets.add(src);
			recordImageImport(ctx.path.map((segment) => segment as string | number));
			ctx.update(src);
		}
	});

	const entry: DataEntry = {
		id,
		data,
	};
	// We do it like this so we don't waste space stringifying
	// the fields if they are not set
	if (body) {
		entry.body = body;
	}
	if (filePath) {
		if (filePath.startsWith('/')) {
			throw new Error(`File path must be relative to the site root. Got: ${filePath}`);
		}
		entry.filePath = filePath;
	}

	if (foundAssets.size) {
		entry.assetImports = Array.from(foundAssets);
	}

	if (imageImports.length) {
		entry.imageImports = imageImports;
	}

	if (digest) {
		entry.digest = digest;
	}
	if (rendered) {
		entry.rendered = rendered;
	}
	if (deferredRender) {
		entry.deferredRender = deferredRender;
	}
	return entry;
}
