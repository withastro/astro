import { ASTRO_GENERATOR } from '../../core/constants.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
function createError(name) {
	return new AstroError({
		...AstroErrorData.UnavailableAstroGlobal,
		message: AstroErrorData.UnavailableAstroGlobal.message(name),
	});
}
function createAstro(site) {
	return {
		// TODO: throw in Astro 7
		get site() {
			console.warn(
				`Astro.site inside getStaticPaths is deprecated and will be removed in a future major version of Astro. Use import.meta.env.SITE instead`,
			);
			return site ? new URL(site) : void 0;
		},
		// TODO: throw in Astro 7
		get generator() {
			console.warn(
				`Astro.generator inside getStaticPaths is deprecated and will be removed in a future major version of Astro.`,
			);
			return ASTRO_GENERATOR;
		},
		get callAction() {
			throw createError('callAction');
		},
		get clientAddress() {
			throw createError('clientAddress');
		},
		get cookies() {
			throw createError('cookies');
		},
		get csp() {
			throw createError('csp');
		},
		get currentLocale() {
			throw createError('currentLocale');
		},
		get getActionResult() {
			throw createError('getActionResult');
		},
		get isPrerendered() {
			throw createError('isPrerendered');
		},
		get locals() {
			throw createError('locals');
		},
		get originPathname() {
			throw createError('originPathname');
		},
		get params() {
			throw createError('params');
		},
		get preferredLocale() {
			throw createError('preferredLocale');
		},
		get preferredLocaleList() {
			throw createError('preferredLocaleList');
		},
		get props() {
			throw createError('props');
		},
		get redirect() {
			throw createError('redirect');
		},
		get request() {
			throw createError('request');
		},
		get response() {
			throw createError('response');
		},
		get rewrite() {
			throw createError('rewrite');
		},
		get routePattern() {
			throw createError('routePattern');
		},
		get self() {
			throw createError('self');
		},
		get slots() {
			throw createError('slots');
		},
		get url() {
			throw createError('url');
		},
		get session() {
			throw createError('session');
		},
		get cache() {
			throw createError('cache');
		},
		get logger() {
			throw createError('logger');
		},
	};
}
export { createAstro };
