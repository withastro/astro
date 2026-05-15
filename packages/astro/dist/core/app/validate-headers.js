import { matchPattern } from '@astrojs/internal-helpers/remote';
function getFirstForwardedValue(multiValueHeader) {
	return multiValueHeader
		?.toString()
		.split(',')
		.map((e) => e.trim())[0];
}
function sanitizeHost(hostname) {
	if (!hostname) return void 0;
	if (/[/\\]/.test(hostname)) return void 0;
	return hostname;
}
function parseHost(host) {
	const parts = host.split(':');
	return {
		hostname: parts[0],
		port: parts[1],
	};
}
function matchesAllowedDomains(hostname, protocol, port, allowedDomains) {
	const hostWithPort = port ? `${hostname}:${port}` : hostname;
	const urlString = `${protocol}://${hostWithPort}`;
	if (!URL.canParse(urlString)) {
		return false;
	}
	const testUrl = new URL(urlString);
	return allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
}
function validateHost(host, protocol, allowedDomains) {
	if (!host || host.length === 0) return void 0;
	if (!allowedDomains || allowedDomains.length === 0) return void 0;
	const sanitized = sanitizeHost(host);
	if (!sanitized) return void 0;
	const { hostname, port } = parseHost(sanitized);
	if (matchesAllowedDomains(hostname, protocol, port, allowedDomains)) {
		return sanitized;
	}
	return void 0;
}
function validateForwardedHeaders(forwardedProtocol, forwardedHost, forwardedPort, allowedDomains) {
	const result = {};
	if (forwardedProtocol) {
		if (allowedDomains && allowedDomains.length > 0) {
			const hasProtocolPatterns = allowedDomains.some((pattern) => pattern.protocol !== void 0);
			if (hasProtocolPatterns) {
				try {
					const testUrl = new URL(`${forwardedProtocol}://example.com`);
					const isAllowed = allowedDomains.some((pattern) =>
						matchPattern(testUrl, { protocol: pattern.protocol }),
					);
					if (isAllowed) {
						result.protocol = forwardedProtocol;
					}
				} catch {}
			} else if (/^https?$/.test(forwardedProtocol)) {
				result.protocol = forwardedProtocol;
			}
		}
	}
	if (forwardedPort && allowedDomains && allowedDomains.length > 0) {
		const hasPortPatterns = allowedDomains.some((pattern) => pattern.port !== void 0);
		if (hasPortPatterns) {
			const isAllowed = allowedDomains.some((pattern) => pattern.port === forwardedPort);
			if (isAllowed) {
				result.port = forwardedPort;
			}
		}
	}
	if (forwardedHost && forwardedHost.length > 0 && allowedDomains && allowedDomains.length > 0) {
		const protoForValidation = result.protocol || 'https';
		const sanitized = sanitizeHost(forwardedHost);
		if (sanitized) {
			const { hostname, port: portFromHost } = parseHost(sanitized);
			const portForValidation = result.port || portFromHost;
			if (matchesAllowedDomains(hostname, protoForValidation, portForValidation, allowedDomains)) {
				result.host = sanitized;
			}
		}
	}
	return result;
}
export { getFirstForwardedValue, validateForwardedHeaders, validateHost };
