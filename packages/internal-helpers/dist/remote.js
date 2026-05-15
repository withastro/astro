function matchPattern(url, remotePattern) {
	return (
		matchProtocol(url, remotePattern.protocol) &&
		matchHostname(url, remotePattern.hostname, true) &&
		matchPort(url, remotePattern.port) &&
		matchPathname(url, remotePattern.pathname, true)
	);
}
function matchPort(url, port) {
	return !port || port === url.port;
}
function matchProtocol(url, protocol) {
	return !protocol || protocol === url.protocol.slice(0, -1);
}
function matchHostname(url, hostname, allowWildcard = false) {
	if (!hostname) {
		return true;
	} else if (!allowWildcard || !hostname.startsWith('*')) {
		return hostname === url.hostname;
	} else if (hostname.startsWith('**.')) {
		const slicedHostname = hostname.slice(2);
		return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
	} else if (hostname.startsWith('*.')) {
		const slicedHostname = hostname.slice(1);
		if (!url.hostname.endsWith(slicedHostname)) {
			return false;
		}
		const subdomainWithDot = url.hostname.slice(0, -(slicedHostname.length - 1));
		return subdomainWithDot.endsWith('.') && !subdomainWithDot.slice(0, -1).includes('.');
	}
	return false;
}
function matchPathname(url, pathname, allowWildcard = false) {
	if (!pathname) {
		return true;
	} else if (!allowWildcard || !pathname.endsWith('*')) {
		return pathname === url.pathname;
	} else if (pathname.endsWith('/**')) {
		const slicedPathname = pathname.slice(0, -2);
		return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
	} else if (pathname.endsWith('/*')) {
		const slicedPathname = pathname.slice(0, -1);
		if (!url.pathname.startsWith(slicedPathname)) {
			return false;
		}
		const additionalPathChunks = url.pathname
			.slice(slicedPathname.length)
			.split('/')
			.filter(Boolean);
		return additionalPathChunks.length === 1;
	}
	return false;
}
function isRemoteAllowed(src, { domains, remotePatterns }) {
	if (!URL.canParse(src)) {
		return false;
	}
	const url = new URL(src);
	if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
		return false;
	}
	return (
		domains.some((domain) => matchHostname(url, domain)) ||
		remotePatterns.some((remotePattern) => matchPattern(url, remotePattern))
	);
}
export { isRemoteAllowed, matchHostname, matchPathname, matchPattern, matchPort, matchProtocol };
