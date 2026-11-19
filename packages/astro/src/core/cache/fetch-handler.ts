import type { FetchPipelineHandler } from '@astrojs/vite-plugin-router';
import { handleCache } from './handler.js';

/** The `cache` pipeline step: wraps the rest of the pipeline with the cache provider. */
const cacheHandler: FetchPipelineHandler = (state, next) => handleCache(state, () => next(state));
export default cacheHandler;
