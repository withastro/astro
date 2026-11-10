import type { ContextProvider } from '@astrojs/vite-plugin-router';
import { markHandlerUsed } from '@astrojs/vite-plugin-router/_internal/core/fetch/features.js';
import type { FetchState } from '@astrojs/vite-plugin-router/_internal/core/fetch/fetch-state.js';
import { createMissingSessionProvider } from './missing-provider.js';
import type { AstroSession } from './runtime.js';

// Drop-in for `./provider.js` substituted by the `astro:session-provider`
// Vite plugin when no session driver is configured (including
// `session: false`). Imports nothing from `./runtime.js`, so the session
// runtime tree-shakes out of the SSR bundle.
//
// `Astro.session` (and `context.session`) reads `undefined`, matching its
// `AstroSession | undefined` type, and warns once on access.

export function createSessionProvider(
	state: FetchState,
): ContextProvider<AstroSession | undefined> {
	return createMissingSessionProvider(state);
}

export function provideSession(state: FetchState): void {
	markHandlerUsed(state.manifest, 'sessions');
	state.provide('session', createMissingSessionProvider(state));
}
