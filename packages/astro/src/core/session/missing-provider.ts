import type { ContextProvider } from '@astrojs/vite-plugin-router';
import type { FetchState } from '@astrojs/vite-plugin-router/_internal/core/fetch/fetch-state.js';
import type { AstroSession } from './runtime.js';

/**
 * The provider used when no session storage is available: `Astro.session` reads `undefined` and
 * the first access warns, so users learn they need to configure session storage.
 */
export function createMissingSessionProvider(
	state: FetchState,
): ContextProvider<AstroSession | undefined> {
	return {
		create() {
			state.logger.warn(
				'session',
				'`Astro.session` was accessed but no session storage is configured. ' +
					'Either configure the storage manually or use an adapter that provides session storage. ' +
					'For more information, see https://docs.astro.build/en/guides/sessions/',
			);
			return undefined;
		},
	};
}
