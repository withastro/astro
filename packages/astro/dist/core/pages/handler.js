import { renderEndpoint } from '../../runtime/server/endpoint.js';
import { renderPage } from '../../runtime/server/index.js';
import {
	ASTRO_ERROR_HEADER,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	REWRITE_DIRECTIVE_HEADER_VALUE,
	ROUTE_TYPE_HEADER,
} from '../constants.js';
import { getCookiesFromResponse } from '../cookies/response.js';
const EMPTY_SLOTS = Object.freeze({});
class PagesHandler {
	#pipeline;
	constructor(pipeline) {
		this.#pipeline = pipeline;
	}
	async handle(state, ctx) {
		const pipeline = this.#pipeline;
		const { logger, streaming } = pipeline;
		let response;
		const componentInstance = await state.loadComponentInstance();
		switch (state.routeData.type) {
			case 'endpoint': {
				response = await renderEndpoint(componentInstance, ctx, state.routeData.prerender, logger);
				break;
			}
			case 'page': {
				const props = await state.getProps();
				const actionApiContext = state.getActionAPIContext();
				const result = await state.createResult(componentInstance, actionApiContext);
				try {
					response = await renderPage(
						result,
						componentInstance?.default,
						props,
						state.slots ?? EMPTY_SLOTS,
						streaming,
						state.routeData,
					);
				} catch (e) {
					result.cancelled = true;
					throw e;
				}
				response.headers.set(ROUTE_TYPE_HEADER, 'page');
				if (state.routeData.route === '/404' || state.routeData.route === '/500') {
					response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
				}
				if (state.isRewriting) {
					response.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
				}
				break;
			}
			case 'redirect': {
				return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: 'true' } });
			}
			case 'fallback': {
				return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
			}
		}
		const responseCookies = getCookiesFromResponse(response);
		if (responseCookies) {
			state.cookies.merge(responseCookies);
		}
		return response;
	}
}
export { PagesHandler };
