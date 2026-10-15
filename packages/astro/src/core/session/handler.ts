import { getEnvironment } from '../environment/index.js';
import { markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { SSRManifest } from '../app/types.js';
import { getSessionDriver } from './driver.js';
import { AstroSession, PERSIST_SYMBOL } from './runtime.js';

const SESSION_KEY = 'session';

/**
 * Registers a session provider on the given `FetchState`. When
 * `state.resolve('session')` is first called, the `AstroSession` is
 * created lazily. When `state.finalizeAll()` runs, any mutations are
 * persisted.
 *
 * No-op (returns synchronously) if sessions are not configured on the
 * manifest, avoiding promise allocation on the hot path.
 */
export function provideSession(state: FetchState): Promise<void> | void {
	markFeatureUsed(state.manifest, FetchFeatures.sessions);
	const config = state.manifest.sessionConfig;
	if (!config) return;

	return provideSessionAsync(state, config);
}

async function provideSessionAsync(
	state: FetchState,
	config: NonNullable<SSRManifest['sessionConfig']>,
): Promise<void> {
	const driverFactory = await getSessionDriver(state.manifest);
	if (!driverFactory) return;

	state.provide<AstroSession>(SESSION_KEY, {
		create() {
			const cookies = state.cookies!;
			return new AstroSession({
				cookies,
				config,
				runtimeMode: getEnvironment(state.manifest).runtimeMode,
				driverFactory,
				mockStorage: null,
				logger: state.logger,
			});
		},
		finalize(session) {
			return session[PERSIST_SYMBOL]();
		},
	});
}
