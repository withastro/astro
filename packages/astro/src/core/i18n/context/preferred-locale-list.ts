import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
import { computePreferredLocaleList } from '../locale-context.js';

/** `Astro.preferredLocaleList` / `context.preferredLocaleList`. */
const preferredLocaleList: RenderContextExtension<string[] | undefined> = (state) => ({
	create: () => computePreferredLocaleList(state),
});
export default preferredLocaleList;
