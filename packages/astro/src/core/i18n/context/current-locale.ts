import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
import { computeCurrentLocale } from '../locale-context.js';

/** `Astro.currentLocale` / `context.currentLocale`. */
const currentLocale: RenderContextExtension<string | undefined> = (state) => ({
	create: () => computeCurrentLocale(state),
});
export default currentLocale;
