import { PipelineFeatures } from '../base-pipeline.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { AstroSession, PERSIST_SYMBOL } from './runtime.js';

const SESSION_KEY = 'session';

/**
 * Registers a session provider on the given `FetchState`. When
 * `state.resolve('session')` is first called, the `AstroSession` is
 * created lazily. When `state.finalizeAll()` runs, any mutations are
 * persisted.
 *
 * No-op (returns synchronously) if sessions are not configured on the
 * pipeline, avoiding promise allocation on the hot path.
 */
export function provideSession(state: FetchState): Promise<void> | void {
	state.pipeline.usedFeatures |= PipelineFeatures.sessions;
	const pipeline = state.pipeline;
	const config = pipeline.manifest.sessionConfig;
	if (!config) return;

	return provideSessionAsync(state, config);
}

async function provideSessionAsync(
	state: FetchState,
	config: NonNullable<typeof state.pipeline.manifest.sessionConfig>,
): Promise<void> {
	const pipeline = state.pipeline;
	const driverFactory = await pipeline.getSessionDriver();
	if (!driverFactory) return;

	state.provide<AstroSession>(SESSION_KEY, {
		create() {
			const cookies = state.cookies!;
			return new AstroSession({
				cookies,
				config,
				runtimeMode: pipeline.runtimeMode,
				driverFactory,
				mockStorage: null,
			});
		},
		finalize(session) {
			return session[PERSIST_SYMBOL]();
		},
	});
}
