const ROUTE404_RE = /^\/404\/?$/;
const ROUTE500_RE = /^\/500\/?$/;
const ROUTE3XX_RE = /^\/3xx\/?$/;

export function isRoute404(route: string) {
	return ROUTE404_RE.test(route);
}

export function isRoute500(route: string) {
	return ROUTE500_RE.test(route);
}

/** Matches the route of the user-provided redirect page, `src/pages/3xx.astro`. */
export function isRoute3xx(route: string) {
	return ROUTE3XX_RE.test(route);
}
