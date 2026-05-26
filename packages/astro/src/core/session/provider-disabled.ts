import { PipelineFeatures } from '../base-pipeline.js';
import { SessionDisabledError } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import type { FetchState } from '../fetch/fetch-state.js';

const SESSION_KEY = 'session';

// Drop-in for `provideSession` substituted in for `./provider.js` by the
// `astro:session-provider` Vite plugin when `session: false` is set.
// Imports nothing from `./runtime.js`, so the session runtime tree-shakes
// out of the SSR bundle.
export function provideSession(state: FetchState): void {
	state.pipeline.usedFeatures |= PipelineFeatures.sessions;
	state.provide(SESSION_KEY, {
		create() {
			throw new AstroError(SessionDisabledError);
		},
	});
}
