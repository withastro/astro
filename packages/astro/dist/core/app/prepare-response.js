import { INTERNAL_RESPONSE_HEADERS, responseSentSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';
function prepareResponse(response, { addCookieHeader }) {
	for (const headerName of INTERNAL_RESPONSE_HEADERS) {
		if (response.headers.has(headerName)) {
			response.headers.delete(headerName);
		}
	}
	if (addCookieHeader) {
		for (const setCookieHeaderValue of getSetCookiesFromResponse(response)) {
			response.headers.append('set-cookie', setCookieHeaderValue);
		}
	}
	Reflect.set(response, responseSentSymbol, true);
}
export { prepareResponse };
