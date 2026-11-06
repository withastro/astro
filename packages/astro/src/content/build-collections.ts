import type fsMod from 'node:fs';
import type { AstroSettings } from '../types/astro.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { BuildDoneCollections } from '../types/public/integrations.js';
import { COLLECTIONS_METADATA_FILE } from './consts.js';
import type { DataEntry } from './data-store.js';
import type { CollectionMetadata } from './metadata.js';
import { MutableDataStore } from './mutable-data-store.js';
import { getDataStoreChunkSize, getDataStoreDir, getDataStoreFile } from './paths.js';

/**
 * Returns the metadata and the entries of the build-time collections, as the build's sync
 * wrote them, for the `astro:build:done` hook. The data store is read on the first call to
 * `entries()`.
 */
export function createBuildCollections({
	fs,
	settings,
	logger,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
	logger: AstroLogger;
}): Required<Pick<BuildDoneCollections, 'metadata' | 'entries'>> {
	const metadataFile = new URL(COLLECTIONS_METADATA_FILE, settings.dotAstroDir);
	const metadata: CollectionMetadata[] = fs.existsSync(metadataFile)
		? JSON.parse(fs.readFileSync(metadataFile, 'utf-8'))
		: [];
	const names = new Set(metadata.map(({ name }) => name));

	let store: Promise<MutableDataStore> | undefined;
	function loadStore() {
		const chunkSize = getDataStoreChunkSize(settings);
		return chunkSize === undefined
			? MutableDataStore.fromFile(getDataStoreFile(settings, false))
			: MutableDataStore.fromDir(getDataStoreDir(settings, false), chunkSize, logger);
	}

	return {
		metadata,
		async entries(name, { content = true } = {}) {
			// Live collections, or names that aren't collections, have no entries at build time
			if (!names.has(name)) return [];
			const entries = (await (store ??= loadStore())).values<DataEntry>(name);
			// Copies, so that an integration can't change the entries given to the others
			return entries.map(({ body, rendered, ...entry }) =>
				structuredClone(content ? { ...entry, body, rendered } : entry),
			);
		},
	};
}
