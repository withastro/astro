import type { ServerIslandMappings, SSRManifest } from '../app/types.js';

/**
 * The server-island mappings for a manifest. Deliberately NOT memoized: the
 * manifest thunk is a module import, which is cheap.
 */
export async function getServerIslands(manifest: SSRManifest): Promise<ServerIslandMappings> {
	if (manifest.serverIslandMappings) {
		return manifest.serverIslandMappings();
	}

	return {
		serverIslandMap: new Map(),
		serverIslandNameMap: new Map(),
	};
}
