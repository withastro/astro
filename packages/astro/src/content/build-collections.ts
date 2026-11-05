import type fsMod from 'node:fs';
import * as devalue from 'devalue';
import type { AstroSettings } from '../types/astro.js';
import type { BuildDoneCollections } from '../types/public/integrations.js';
import { COLLECTIONS_METADATA_FILE, DATA_STORE_MANIFEST_FILE } from './consts.js';
import { ChunkedCollectionParser, type DataEntry } from './data-store.js';
import type { DataStoreManifest } from './data-store-writer.js';
import type { CollectionMetadata } from './metadata.js';
import { getDataStoreChunkSize, getDataStoreDir, getDataStoreFile } from './paths.js';

/**
 * Returns the metadata and the entries of the build-time collections, as the build's sync
 * wrote them, for the `astro:build:done` hook. Each call to `entries()` reads its collection
 * from the data store, and keeps nothing once it returns.
 */
export function createBuildCollections({
	fs,
	settings,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
}): Required<Pick<BuildDoneCollections, 'metadata' | 'entries'>> {
	const metadataFile = new URL(COLLECTIONS_METADATA_FILE, settings.dotAstroDir);
	const metadata: CollectionMetadata[] = fs.existsSync(metadataFile)
		? JSON.parse(fs.readFileSync(metadataFile, 'utf-8'))
		: [];
	const names = new Set(metadata.map(({ name }) => name));

	return {
		metadata,
		async entries(name, { content = true } = {}) {
			// Live collections, or names that aren't collections, have no entries at build time
			if (!names.has(name)) return [];
			const entries = [...((await readCollection(fs, settings, name))?.values() ?? [])];
			return content
				? entries
				: entries.map(({ body: _body, rendered: _rendered, ...entry }) => entry);
		},
	};
}

/** Reads one collection of the build's data store. */
async function readCollection(
	fs: typeof fsMod,
	settings: AstroSettings,
	name: string,
): Promise<Map<string, DataEntry> | undefined> {
	if (getDataStoreChunkSize(settings) === undefined) {
		const file = getDataStoreFile(settings, false);
		if (!fs.existsSync(file)) return undefined;
		// A single-file store can only be parsed whole: the other collections are dropped on return
		const store: Map<string, Map<string, DataEntry>> = devalue.parse(
			await fs.promises.readFile(file, 'utf-8'),
		);
		return store.get(name);
	}
	const dir = getDataStoreDir(settings, false);
	const manifestFile = new URL(`./${DATA_STORE_MANIFEST_FILE}`, dir);
	if (!fs.existsSync(manifestFile)) return undefined;
	const manifest: DataStoreManifest = JSON.parse(await fs.promises.readFile(manifestFile, 'utf-8'));
	// Only the parts of the collection are read
	const parser = new ChunkedCollectionParser();
	for (const part of manifest[name] ?? []) {
		parser.add(await fs.promises.readFile(new URL(`./${part}`, dir), 'utf-8'));
	}
	return parser.finish();
}
