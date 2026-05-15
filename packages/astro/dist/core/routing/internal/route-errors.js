const ROUTE404_RE = /^\/404\/?$/;
const ROUTE500_RE = /^\/500\/?$/;
function isRoute404(route) {
	return ROUTE404_RE.test(route);
}
function isRoute500(route) {
	return ROUTE500_RE.test(route);
}
export { isRoute404, isRoute500 };
