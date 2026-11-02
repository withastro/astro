import { randomUUID } from 'node:crypto';
import type fsMod from 'node:fs';
import type { RunnableDevEnvironment, ViteDevServer } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { importEntrypoint } from '../core/entrypoint.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { STORED_COLLECTIONS_FILE } from './consts.js';
import type { DataEntry } from './data-store.js';
import {
	type CollectionStorageDescriptor,
	type CollectionStorageDriver,
	serializeEntry,
} from './storage.js';

/**
 * Describes where the collections with a storage driver were written by the last sync. Sync
 * writes it to a file in the `.astro` directory, and the build reads it to bundle the drivers
 * and the snapshot each one must read.
 */
export interface StoredCollectionsManifest {
	drivers: StoredSnapshot[];
}

/** A snapshot written with one storage descriptor, and the collections it holds. */
export interface StoredSnapshot {
	/** Package specifier or file URL `href` of the driver's entrypoint. */
	entrypoint: string;
	config?: Record<string, unknown>;
	snapshot: string;
	collections: string[];
}

/** Reads the manifest written by the last sync, or returns `undefined` when there is none. */
export function readStoredCollectionsManifest(
	fs: typeof fsMod,
	dotAstroDir: URL,
): StoredCollectionsManifest | undefined {
	const file = new URL(STORED_COLLECTIONS_FILE, dotAstroDir);
	if (!fs.existsSync(file)) return undefined;
	return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/** A storage descriptor whose entrypoint was normalized by `normalizeEntrypoint()`. */
export type NormalizedStorageDescriptor = CollectionStorageDescriptor & { entrypoint: string };

export type LoadCollectionStorageDriver = (
	descriptor: NormalizedStorageDescriptor,
) => Promise<CollectionStorageDriver>;

/**
 * Returns a function that creates the driver of a storage descriptor by importing its
 * entrypoint with `importModule`. Drivers are created once per descriptor and reused, as each
 * sync in development writes to the same drivers.
 */
export function createDriverLoader(
	importModule: (entrypoint: string) => Promise<{ default?: unknown }> = importEntrypoint,
): LoadCollectionStorageDriver {
	const drivers = new Map<string, Promise<CollectionStorageDriver>>();
	return (descriptor) => {
		const key = getDescriptorKey(descriptor);
		let driver = drivers.get(key);
		if (!driver) {
			driver = importDriver(descriptor, importModule);
			drivers.set(key, driver);
			// Retry on the next sync instead of caching the failure
			driver.catch(() => drivers.delete(key));
		}
		return driver;
	};
}

/**
 * Returns a driver loader that imports entrypoints through the Vite runner that loads the
 * content config. Entrypoints then resolve from the project root, and drivers can import
 * virtual modules such as `astro:env/server`, as they do once bundled with the server.
 */
export function createViteDriverLoader(viteServer: ViteDevServer): LoadCollectionStorageDriver {
	const environment = viteServer.environments[
		ASTRO_VITE_ENVIRONMENT_NAMES.astro
	] as RunnableDevEnvironment;
	return createDriverLoader((entrypoint) => environment.runner.import(entrypoint));
}

async function importDriver(
	{ entrypoint, config }: NormalizedStorageDescriptor,
	importModule: (entrypoint: string) => Promise<{ default?: unknown }>,
): Promise<CollectionStorageDriver> {
	const invalid = (reason: string, cause?: unknown) =>
		new AstroError(
			{
				...AstroErrorData.InvalidCollectionStorageDriver,
				message: AstroErrorData.InvalidCollectionStorageDriver.message(entrypoint, reason),
			},
			{ cause },
		);

	let module: { default?: unknown };
	try {
		module = await importModule(entrypoint);
	} catch (cause) {
		throw invalid('Its entrypoint could not be imported.', cause);
	}
	if (typeof module.default !== 'function') {
		throw invalid('Its entrypoint must default-export a function that creates the driver.');
	}
	const driver = await module.default(config);
	if (typeof driver?.openWriter !== 'function' || typeof driver?.openReader !== 'function') {
		throw invalid('The driver must implement `openWriter()` and `openReader()`.');
	}
	return driver;
}

/**
 * Writes the collections that have a storage driver to a new snapshot of their driver, and
 * returns where they were written. Collections sharing a storage descriptor share a driver
 * and a snapshot.
 */
export async function writeStoredCollections({
	collections,
	readEntries,
	loadDriver,
}: {
	/** The storage descriptor of each collection that has one. */
	collections: Map<string, NormalizedStorageDescriptor>;
	readEntries: (collection: string) => DataEntry[];
	loadDriver: LoadCollectionStorageDriver;
}): Promise<StoredCollectionsManifest> {
	const groups = new Map<string, { descriptor: NormalizedStorageDescriptor; names: string[] }>();
	for (const [name, descriptor] of collections) {
		const key = getDescriptorKey(descriptor);
		const group = groups.get(key) ?? { descriptor, names: [] };
		group.names.push(name);
		groups.set(key, group);
	}

	const manifest: StoredCollectionsManifest = { drivers: [] };
	for (const { descriptor, names } of groups.values()) {
		const driver = await loadDriver(descriptor);
		const snapshot = (await driver.createSnapshotId?.()) ?? randomUUID();
		if (typeof snapshot !== 'string' || snapshot === '') {
			throw new AstroError({
				...AstroErrorData.InvalidCollectionStorageDriver,
				message: AstroErrorData.InvalidCollectionStorageDriver.message(
					descriptor.entrypoint,
					'`createSnapshotId()` must return a non-empty string.',
				),
			});
		}
		const writer = await driver.openWriter({ snapshot, dev: false });
		for (const name of names) {
			await writer.write(name, readEntries(name).map(serializeEntry));
		}
		await writer.commit();
		manifest.drivers.push({
			entrypoint: descriptor.entrypoint,
			config: descriptor.config,
			snapshot,
			collections: names,
		});
	}
	return manifest;
}

function getDescriptorKey({ entrypoint, config }: NormalizedStorageDescriptor): string {
	return JSON.stringify([entrypoint, config ?? null]);
}
