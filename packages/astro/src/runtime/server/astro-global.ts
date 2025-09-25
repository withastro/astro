import { ASTRO_GENERATOR } from '../../core/constants.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { AstroGlobal } from '../../types/public/context.js';

// This is used to create the top-level Astro global; the one that you can use
// inside of getStaticPaths. See the `astroGlobalArgs` option for parameter type.
export function createAstro(site: string | undefined): AstroGlobal {
	return new Proxy({} as AstroGlobal, {
		get(_, prop: keyof AstroGlobal) {
			if (prop === 'site') {
				// This is created inside of the runtime so we don't have access to the Astro logger.
				console.warn(
					`Astro.site inside getStaticPaths is deprecated and will be removed in a future major version of Astro. Use import.meta.env.SITE instead`,
				);
				return site ? new URL(site) : undefined;
			}

			if (prop === 'generator') {
				// This is created inside of the runtime so we don't have access to the Astro logger.
				console.warn(
					`Astro.generator inside getStaticPaths is deprecated and will be removed in a future major version of Astro.`,
				);
				return ASTRO_GENERATOR;
			}

			throw new AstroError({
				...AstroErrorData.UnavailableAstroGlobalProperty,
				message: AstroErrorData.UnavailableAstroGlobalProperty.message(prop),
			});
		},
	});
}
