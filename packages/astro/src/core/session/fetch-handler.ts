import type { FetchPipelineHandler } from '@astrojs/vite-plugin-router';

/**
 * The `sessions` pipeline step. The session itself comes from the `session` render context
 * extension; registering this step makes `BaseApp` warn when a custom `src/fetch.ts` skips
 * `sessions()`.
 */
const sessionsHandler: FetchPipelineHandler = (state, next) => next(state);
export default sessionsHandler;
