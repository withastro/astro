import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
// Imported through `../session/` so the `astro:session-provider` plugin's
// `/session/provider.js` filter can swap in the disabled provider.
import { createSessionProvider } from '../session/provider.js';

/** `Astro.session` / `context.session`, registered with `api.astroRouter.extendRenderContext()`. */
const sessionExtension: RenderContextExtension = createSessionProvider;
export default sessionExtension;
