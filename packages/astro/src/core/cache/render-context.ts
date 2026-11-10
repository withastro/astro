import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
import { createCacheProvider } from './handler.js';

/** `Astro.cache` / `context.cache`, registered with `api.astroRouter.extendRenderContext()`. */
const cacheExtension: RenderContextExtension = createCacheProvider;
export default cacheExtension;
