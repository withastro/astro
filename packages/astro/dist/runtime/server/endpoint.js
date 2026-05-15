import colors from 'piccolore';
import { REROUTABLE_STATUS_CODES, REROUTE_DIRECTIVE_HEADER } from '../../core/constants.js';
import { AstroError } from '../../core/errors/errors.js';
import { EndpointDidNotReturnAResponse } from '../../core/errors/errors-data.js';
async function renderEndpoint(mod, context, isPrerendered, logger) {
	const { request, url } = context;
	const method = request.method.toUpperCase();
	let handler = mod[method] ?? mod['ALL'];
	if (!handler && method === 'HEAD' && mod['GET']) {
		handler = mod['GET'];
	}
	if (isPrerendered && !['GET', 'HEAD'].includes(method)) {
		logger.warn(
			'router',
			`${url.pathname} ${colors.bold(
				method,
			)} requests are not available in static endpoints. Mark this page as server-rendered (\`export const prerender = false;\`) or update your config to \`output: 'server'\` to make all your pages server-rendered by default.`,
		);
	}
	if (handler === void 0) {
		logger.warn(
			'router',
			`No API Route handler exists for the method "${method}" for the route "${url.pathname}".
Found handlers: ${Object.keys(mod)
				.map((exp) => JSON.stringify(exp))
				.join(', ')}
` +
				('all' in mod
					? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?
`
					: ''),
		);
		return new Response(null, { status: 404 });
	}
	if (typeof handler !== 'function') {
		logger.error(
			'router',
			`The route "${url.pathname}" exports a value for the method "${method}", but it is of the type ${typeof handler} instead of a function.`,
		);
		return new Response(null, { status: 500 });
	}
	let response = await handler.call(mod, context);
	if (!response || response instanceof Response === false) {
		throw new AstroError(EndpointDidNotReturnAResponse);
	}
	if (REROUTABLE_STATUS_CODES.includes(response.status)) {
		try {
			response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
		} catch (err) {
			if (err.message?.includes('immutable')) {
				response = new Response(response.body, response);
				response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
			} else {
				throw err;
			}
		}
	}
	if (method === 'HEAD') {
		return new Response(null, response);
	}
	return response;
}
export { renderEndpoint };
