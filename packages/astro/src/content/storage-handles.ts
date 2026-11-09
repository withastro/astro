import type fsMod from 'node:fs';
import { DEFAULT_404_COMPONENT } from '../core/constants.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroSettings } from '../types/astro.js';
import type { RouteData } from '../types/public/internal.js';
import type { CollectionStorageHandle } from './storage.js';
import { type LoadCollectionStorageDriver, readStoredCollectionsManifest } from './storage-sync.js';

/**
 * Returns whether the server a build produced may read collection storage snapshots: whether
 * it renders a route on demand, other than the internal routes that never run project code.
 */
export function readsSnapshotsAtRuntime(settings: AstroSettings, routes: RouteData[]): boolean {
	return (
		settings.buildOutput === 'server' &&
		routes.some(
			(route) =>
				!route.prerender &&
				!(
					route.origin === 'internal' &&
					(route.component === DEFAULT_404_COMPONENT ||
						route.route === settings.config.image.endpoint.route)
				),
		)
	);
}

/**
 * Returns a handle for each storage descriptor the build wrote a snapshot with, for the
 * `astro:build:done` hook. `deleteSnapshot()` refuses to delete the build's own snapshot when
 * the server it produced reads it.
 */
export async function createStorageHandles({
	fs,
	dotAstroDir,
	loadDriver,
	readAtRuntime,
}: {
	fs: typeof fsMod;
	dotAstroDir: URL;
	loadDriver: LoadCollectionStorageDriver;
	/** Whether pages rendered on demand read the snapshots. */
	readAtRuntime: boolean;
}): Promise<CollectionStorageHandle[]> {
	const manifest = readStoredCollectionsManifest(fs, dotAstroDir);
	if (!manifest) return [];
	return Promise.all(
		manifest.drivers.map(async ({ entrypoint, config, snapshot, collections }) => {
			const driver = await loadDriver({ entrypoint, config });
			const handle: CollectionStorageHandle = { collections, snapshot, readAtRuntime };
			if (driver.listSnapshots) {
				handle.listSnapshots = () => driver.listSnapshots!();
			}
			if (driver.deleteSnapshot) {
				handle.deleteSnapshot = async (snapshotToDelete) => {
					if (readAtRuntime && snapshotToDelete === snapshot) {
						throw new AstroError({
							...AstroErrorData.CollectionStorageSnapshotInUse,
							message: AstroErrorData.CollectionStorageSnapshotInUse.message(snapshot),
						});
					}
					await driver.deleteSnapshot!(snapshotToDelete);
				};
			}
			return handle;
		}),
	);
}
