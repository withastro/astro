function getFirstForwardedValue(multiValueHeader) {
	return multiValueHeader
		?.toString()
		?.split(',')
		.map((e) => e.trim())?.[0];
}
const IP_RE = /^[0-9a-fA-F.:]{1,45}$/;
function isValidIpAddress(value) {
	return IP_RE.test(value);
}
function getValidatedIpFromHeader(headerValue) {
	const raw = getFirstForwardedValue(headerValue);
	if (raw && isValidIpAddress(raw)) {
		return raw;
	}
	return void 0;
}
function getClientIpAddress(request) {
	return getValidatedIpFromHeader(request.headers.get('x-forwarded-for'));
}
export { getClientIpAddress, getFirstForwardedValue, getValidatedIpFromHeader, isValidIpAddress };
