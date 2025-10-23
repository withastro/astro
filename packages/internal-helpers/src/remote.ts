export type RemotePattern = {
	hostname?: string;
	pathname?: string;
	protocol?: string;
	port?: string;
};

/**
 * Evaluates whether a given URL matches the specified remote pattern based on protocol, hostname, port, and pathname.
 *
 * @param {URL} url - The URL object to be matched against the remote pattern.
 * @param {RemotePattern} remotePattern - The remote pattern object containing the protocol, hostname, port, and pathname to match.
 * @return {boolean} Returns `true` if the URL matches the given remote pattern; otherwise, `false`.
 */
export function matchPattern(url: URL, remotePattern: RemotePattern): boolean {
	return (
		matchProtocol(url, remotePattern.protocol) &&
		matchHostname(url, remotePattern.hostname, true) &&
		matchPort(url, remotePattern.port) &&
		matchPathname(url, remotePattern.pathname, true)
	);
}

/**
 * Checks if the given URL's port matches the specified port. If no port is provided, it returns `true`.
 *
 * @param {URL} url - The URL object whose port will be checked.
 * @param {string} [port=] - The port to match against the URL's port. Optional.
 * @return {boolean} Returns `true` if the URL's port matches the specified port or if no port is provided; otherwise, `false`.
 */
export function matchPort(url: URL, port?: string): boolean {
	return !port || port === url.port;
}

/**
 * Compares the protocol of the provided URL with a specified protocol.
 *
 * @param {URL} url - The URL object whose protocol needs to be checked.
 * @param {string} [protocol] - The protocol to compare against, without the trailing colon. If not provided, the method will always return `true`.
 * @return {boolean} Returns `true` if the protocol matches or if no protocol is specified; otherwise, `false`.
 */
export function matchProtocol(url: URL, protocol?: string): boolean {
	return !protocol || protocol === url.protocol.slice(0, -1);
}

/**
 * Matches a given URL's hostname against a specified hostname, with optional support for wildcard patterns.
 *
 * @param {URL} url - The URL object whose hostname is to be matched.
 * @param {string} [hostname] - The hostname to match against. Supports wildcard patterns if `allowWildcard` is `true`.
 * @param {boolean} [allowWildcard=false] - Indicates whether wildcard patterns in the `hostname` parameter are allowed.
 * @return {boolean} - Returns `true` if the URL's hostname matches the given hostname criteria; otherwise, `false`.
 */
export function matchHostname(url: URL, hostname?: string, allowWildcard = false): boolean {
	if (!hostname) {
		return true;
	} else if (!allowWildcard || !hostname.startsWith('*')) {
		return hostname === url.hostname;
	} else if (hostname.startsWith('**.')) {
		const slicedHostname = hostname.slice(2); // ** length
		return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
	} else if (hostname.startsWith('*.')) {
		const slicedHostname = hostname.slice(1); // * length
		const additionalSubdomains = url.hostname
			.replace(slicedHostname, '')
			.split('.')
			.filter(Boolean);
		return additionalSubdomains.length === 1;
	}

	return false;
}

/**
 * Matches a given URL's pathname against a specified pattern, with optional support for wildcards.
 *
 * @param {URL} url - The URL object containing the pathname to be matched.
 * @param {string} [pathname] - The pathname pattern to match the URL against.
 * @param {boolean} [allowWildcard=false] - Determines whether wildcard matching is allowed.
 * @return {boolean} - Returns `true` if the URL's pathname matches the specified pattern; otherwise, `false`.
 */
export function matchPathname(url: URL, pathname?: string, allowWildcard = false): boolean {
	if (!pathname) {
		return true;
	} else if (!allowWildcard || !pathname.endsWith('*')) {
		return pathname === url.pathname;
	} else if (pathname.endsWith('/**')) {
		const slicedPathname = pathname.slice(0, -2); // ** length
		return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
	} else if (pathname.endsWith('/*')) {
		const slicedPathname = pathname.slice(0, -1); // * length
		const additionalPathChunks = url.pathname
			.replace(slicedPathname, '')
			.split('/')
			.filter(Boolean);
		return additionalPathChunks.length === 1;
	}

	return false;
}

/**
 * Determines whether a given remote resource, identified by its source URL,
 * is allowed based on specified domains and remote patterns.
 *
 * @param {string} src - The source URL of the remote resource to be validated.
 * @param {Object} options - The configuration options for domain and pattern matching.
 * @param {string[]} options.domains - A list of allowed domain names.
 * @param {RemotePattern[]} options.remotePatterns - A list of allowed remote patterns for matching.
 * @return {boolean} Returns `true` if the source URL matches any of the specified domains or remote patterns; otherwise, `false`.
 */
export function isRemoteAllowed(
	src: string,
	{
		domains,
		remotePatterns,
	}: {
		domains: string[];
		remotePatterns: RemotePattern[];
	},
): boolean {
	if (!URL.canParse(src)) {
		return false;
	}

	const url = new URL(src);

	// Data URLs are always allowed
	if (url.protocol === 'data:') {
		return true;
	}

	// Non-http(s) protocols are never allowed
	if (!['http:', 'https:'].includes(url.protocol)) {
		return false;
	}

	return (
		domains.some((domain) => matchHostname(url, domain)) ||
		remotePatterns.some((remotePattern) => matchPattern(url, remotePattern))
	);
}
