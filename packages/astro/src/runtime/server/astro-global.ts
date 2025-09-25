import { ASTRO_VERSION } from '../../core/constants.js';
import type { AstroGlobalPartial } from '../../types/public/context.js';

// This is used to create the top-level Astro global; the one that you can use
// inside of getStaticPaths. See the `astroGlobalArgs` option for parameter type.
export function createAstro(site: string | undefined): AstroGlobalPartial {
	return {
		site: site ? new URL(site) : undefined,
		generator: `Astro v${ASTRO_VERSION}`,
	};
}
