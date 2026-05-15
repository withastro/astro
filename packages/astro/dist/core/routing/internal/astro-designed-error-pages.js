import notFoundTemplate from '../../../template/4xx.js';
import { DEFAULT_404_COMPONENT } from '../../constants.js';
const DEFAULT_404_ROUTE = {
	component: DEFAULT_404_COMPONENT,
	params: [],
	pattern: /^\/404\/?$/,
	prerender: false,
	pathname: '/404',
	segments: [[{ content: '404', dynamic: false, spread: false }]],
	type: 'page',
	route: '/404',
	fallbackRoutes: [],
	isIndex: false,
	origin: 'internal',
	distURL: [],
};
async function default404Page({ pathname }) {
	return new Response(
		notFoundTemplate({
			statusCode: 404,
			title: 'Not found',
			tabTitle: '404: Not Found',
			pathname,
		}),
		{ status: 404, headers: { 'Content-Type': 'text/html' } },
	);
}
default404Page.isAstroComponentFactory = true;
const default404Instance = {
	default: default404Page,
};
export { DEFAULT_404_ROUTE, default404Instance };
