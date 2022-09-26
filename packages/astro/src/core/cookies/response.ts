import type { AstroCookies } from './cookies';

const astroCookiesSymbol = Symbol.for('astro.cookies');

export function attachToResponse(response: Response, cookies: AstroCookies) {
	Reflect.set(response, astroCookiesSymbol, cookies);
}

function getFromResponse(response: Response): AstroCookies | undefined {
	let cookies = Reflect.get(response, astroCookiesSymbol);
	if(cookies != null) {
		return cookies as AstroCookies;
	} else {
		return undefined;
	}
}

export function * getSetCookiesFromResponse(response: Response): Generator<string, void, unknown> {
	const cookies = getFromResponse(response);
	if(!cookies) {
		return;
	}
	for(const headerValue of cookies.headers()) {
		yield headerValue;
	}
}
