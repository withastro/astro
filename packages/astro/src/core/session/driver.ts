import type { SSRManifest } from '../app/types.js';
import { createAsyncManifestMemo } from '../manifest/memo.js';
import type { SessionDriverFactory } from './types.js';

const sessionDriverMemo = createAsyncManifestMemo<SessionDriverFactory | null>(async (manifest) => {
	// Try to load the driver from the manifest; `null` (no driver configured
	// or the module has no default export) is cached like any other value.
	if (manifest.sessionDriver) {
		const driverModule = await manifest.sessionDriver();
		return driverModule?.default || null;
	}
	return null;
});

/** Resolves the session driver factory from the manifest, `null` when none. */
export function getSessionDriver(manifest: SSRManifest): Promise<SessionDriverFactory | null> {
	return sessionDriverMemo.get(manifest);
}
