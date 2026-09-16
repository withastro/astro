import { markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import type { FetchState } from '../fetch/fetch-state.js';

// Drop-in for `provideSession` substituted in for `./provider.js` by the
// `astro:session-provider` Vite plugin when `session: false` is set.
// Imports nothing from `./runtime.js`, so the session runtime tree-shakes
// out of the SSR bundle.
//
// It registers no session provider, so `Astro.session` (and
// `context.session`) is `undefined` — the same behavior as a project
// without sessions configured, matching its `AstroSession | undefined`
// type. We still mark the feature as used so the missing-feature warning
// in `BaseApp` never fires.
export function provideSession(state: FetchState): void {
	markFeatureUsed(state.manifest, FetchFeatures.sessions);
}
