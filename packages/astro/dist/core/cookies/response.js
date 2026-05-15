const astroCookiesSymbol = /* @__PURE__ */ Symbol.for('astro.cookies');
function attachCookiesToResponse(response, cookies) {
	Reflect.set(response, astroCookiesSymbol, cookies);
}
function getCookiesFromResponse(response) {
	let cookies = Reflect.get(response, astroCookiesSymbol);
	if (cookies != null) {
		return cookies;
	} else {
		return void 0;
	}
}
function* getSetCookiesFromResponse(response) {
	const cookies = getCookiesFromResponse(response);
	if (!cookies) {
		return [];
	}
	for (const headerValue of cookies.consume()) {
		yield headerValue;
	}
	return [];
}
export { attachCookiesToResponse, getCookiesFromResponse, getSetCookiesFromResponse };
