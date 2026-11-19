import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
import { computePreferredLocale } from '../locale-context.js';

/** `Astro.preferredLocale` / `context.preferredLocale`. */
const preferredLocale: RenderContextExtension<string | undefined> = (state) => ({
	create: () => computePreferredLocale(state),
});
export default preferredLocale;
