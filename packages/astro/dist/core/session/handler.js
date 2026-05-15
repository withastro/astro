import { PipelineFeatures } from '../base-pipeline.js';
import { AstroSession, PERSIST_SYMBOL } from './runtime.js';
const SESSION_KEY = 'session';
function provideSession(state) {
	state.pipeline.usedFeatures |= PipelineFeatures.sessions;
	const pipeline = state.pipeline;
	const config = pipeline.manifest.sessionConfig;
	if (!config) return;
	return provideSessionAsync(state, config);
}
async function provideSessionAsync(state, config) {
	const pipeline = state.pipeline;
	const driverFactory = await pipeline.getSessionDriver();
	if (!driverFactory) return;
	state.provide(SESSION_KEY, {
		create() {
			const cookies = state.cookies;
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
export { provideSession };
