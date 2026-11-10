import type { ContextProvider } from '@astrojs/vite-plugin-router';
import { getEnvironment } from '@astrojs/vite-plugin-router/_internal/core/environment/index.js';
import { markHandlerUsed } from '@astrojs/vite-plugin-router/_internal/core/fetch/features.js';
import type { FetchState } from '@astrojs/vite-plugin-router/_internal/core/fetch/fetch-state.js';
import type { SSRManifest } from '@astrojs/vite-plugin-router/_internal/core/app/types.js';
import { getSessionDriver } from './driver.js';
import { createMissingSessionProvider } from './missing-provider.js';
import { AstroSession, PERSIST_SYMBOL } from './runtime.js';

const SESSION_KEY = 'session';

/**
 * Creates the provider of `Astro.session` / `context.session`. The
 * `AstroSession` is created lazily on first access and its mutations are
 * persisted by `state.finalizeAll()`.
 *
 * When sessions are not configured (or no driver is available) the provider
 * yields `undefined` and warns once on access, so users learn they need to
 * configure session storage. Returns synchronously in that case, avoiding
 * promise allocation on the hot path.
 */
export function createSessionProvider(
	state: FetchState,
): ContextProvider<AstroSession | undefined> | Promise<ContextProvider<AstroSession | undefined>> {
	const config = state.manifest.sessionConfig;
	if (!config) return createMissingSessionProvider(state);

	return createSessionProviderAsync(state, config);
}

async function createSessionProviderAsync(
	state: FetchState,
	config: NonNullable<SSRManifest['sessionConfig']>,
): Promise<ContextProvider<AstroSession | undefined>> {
	const driverFactory = await getSessionDriver(state.manifest);
	if (!driverFactory) return createMissingSessionProvider(state);

	return {
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
			return session?.[PERSIST_SYMBOL]();
		},
	};
}

/**
 * Registers the session provider on the given `FetchState` (the
 * `astro/fetch` `sessions()` handler).
 */
export function provideSession(state: FetchState): Promise<void> | void {
	markHandlerUsed(state.manifest, 'sessions');
	const provider = createSessionProvider(state);
	if (provider instanceof Promise) {
		return provider.then((p) => state.provide(SESSION_KEY, p));
	}
	state.provide(SESSION_KEY, provider);
}
