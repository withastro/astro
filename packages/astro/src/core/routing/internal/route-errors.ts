const ROUTE404_RE = /^\/404\/?$/;
const ROUTE500_RE = /^\/500\/?$/;

export function isRoute404(route: string) {
	return ROUTE404_RE.test(route);
}

export function isRoute500(route: string) {
	return ROUTE500_RE.test(route);
}
