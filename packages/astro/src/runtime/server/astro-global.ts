import { ASTRO_GENERATOR } from '../../core/constants.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { AstroGlobal } from '../../types/public/context.js';

function createError(name: string) {
	return new AstroError({
		...AstroErrorData.UnavailableAstroGlobalProperty,
		message: AstroErrorData.UnavailableAstroGlobalProperty.message(name),
	});
}

// This is used to create the top-level Astro global; the one that you can use
// inside of getStaticPaths. See the `astroGlobalArgs` option for parameter type.
export function createAstro(site: string | undefined): AstroGlobal {
	return {
		// TODO: throw in Astro 7
		get site() {
			// This is created inside of the runtime so we don't have access to the Astro logger.
			console.warn(
				`Astro.site inside getStaticPaths is deprecated and will be removed in a future major version of Astro. Use import.meta.env.SITE instead`,
			);
			return site ? new URL(site) : undefined;
		},
		// TODO: throw in Astro 7
		get generator() {
			// This is created inside of the runtime so we don't have access to the Astro logger.
			console.warn(
				`Astro.generator inside getStaticPaths is deprecated and will be removed in a future major version of Astro.`,
			);
			return ASTRO_GENERATOR;
		},
		get callAction(): any {
			throw createError('callAction');
		},
		get clientAddress(): any {
			throw createError('clientAddress');
		},
		get cookies(): any {
			throw createError('cookies');
		},
		get csp(): any {
			throw createError('csp');
		},
		get currentLocale(): any {
			throw createError('currentLocale');
		},
		get getActionResult(): any {
			throw createError('getActionResult');
		},
		get isPrerendered(): any {
			throw createError('isPrerendered');
		},
		get locals(): any {
			throw createError('locals');
		},
		get originPathname(): any {
			throw createError('originPathname');
		},
		get params(): any {
			throw createError('params');
		},
		get preferredLocale(): any {
			throw createError('preferredLocale');
		},
		get preferredLocaleList(): any {
			throw createError('preferredLocaleList');
		},
		get props(): any {
			throw createError('props');
		},
		get redirect(): any {
			throw createError('redirect');
		},
		get request(): any {
			throw createError('request');
		},
		get response(): any {
			throw createError('response');
		},
		get rewrite(): any {
			throw createError('rewrite');
		},
		get routePattern(): any {
			throw createError('routePattern');
		},
		get self(): any {
			throw createError('self');
		},
		get slots(): any {
			throw createError('slots');
		},
		get url(): any {
			throw createError('url');
		},
		get session(): any {
			throw createError('session');
		},
	};
}
