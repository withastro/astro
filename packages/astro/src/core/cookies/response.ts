import type { AstroCookies } from './cookies.js';

const astroCookiesSymbol = Symbol.for('astro.cookies');

export function attachCookiesToResponse(response: Response, cookies: AstroCookies) {
	Reflect.set(response, astroCookiesSymbol, cookies);
}

export function responseHasCookies(response: Response): boolean {
	return Reflect.has(response, astroCookiesSymbol);
}

function getFromResponse(response: Response): AstroCookies | undefined {
	let cookies = Reflect.get(response, astroCookiesSymbol);
	if (cookies != null) {
		return cookies as AstroCookies;
	} else {
		return undefined;
	}
}

export function* getSetCookiesFromResponse(response: Response): Generator<string, string[]> {
	const cookies = getFromResponse(response);
	if (!cookies) {
		return [];
	}
	for (const headerValue of cookies.headers()) {
		yield headerValue;
	}

	return [];
}
