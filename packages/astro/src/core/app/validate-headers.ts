import { matchPattern, matchHostname, type RemotePattern } from '@astrojs/internal-helpers/remote';

/**
 * Sanitize a hostname by rejecting any with path separators.
 * Prevents path injection attacks. Invalid hostnames return undefined.
 */
function sanitizeHost(hostname: string | undefined): string | undefined {
	if (!hostname) return undefined;
	// Reject any hostname containing path separators - they're invalid
	if (/[/\\]/.test(hostname)) return undefined;
	return hostname;
}

interface ParsedHost {
	hostname: string;
	port: string | undefined;
}

/**
 * Parse a host string into hostname and port components.
 */
function parseHost(host: string): ParsedHost {
	const parts = host.split(':');
	return {
		hostname: parts[0],
		port: parts[1],
	};
}

/**
 * Check if a host matches any of the allowed domain patterns.
 * Assumes hostname and port are already sanitized/parsed.
 */
function matchesAllowedDomains(
	hostname: string,
	protocol: string,
	port: string | undefined,
	allowedDomains: Partial<RemotePattern>[],
): boolean {
	const hostWithPort = port ? `${hostname}:${port}` : hostname;
	const urlString = `${protocol}://${hostWithPort}`;

	if (!URL.canParse(urlString)) {
		return false;
	}

	const testUrl = new URL(urlString);
	return allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
}

/**
 * Validate a host against allowedDomains.
 * Returns the host only if it matches an allowed pattern, otherwise undefined.
 * This prevents SSRF attacks by ensuring the Host header is trusted.
 */
export function validateHost(
	host: string | undefined,
	protocol: string,
	allowedDomains?: Partial<RemotePattern>[],
): string | undefined {
	if (!host || host.length === 0) return undefined;
	if (!allowedDomains || allowedDomains.length === 0) return undefined;

	const sanitized = sanitizeHost(host);
	if (!sanitized) return undefined;

	const { hostname, port } = parseHost(sanitized);
	if (matchesAllowedDomains(hostname, protocol, port, allowedDomains)) {
		return sanitized;
	}

	return undefined;
}

/**
 * Validate forwarded headers (proto, host, port) against allowedDomains.
 * Returns validated values or undefined for rejected headers.
 * Uses strict defaults: http/https only for proto, rejects port if not in allowedDomains.
 */
export function validateForwardedHeaders(
	forwardedProtocol?: string,
	forwardedHost?: string,
	forwardedPort?: string,
	allowedDomains?: Partial<RemotePattern>[],
): { protocol?: string; host?: string; port?: string } {
	const result: { protocol?: string; host?: string; port?: string } = {};

	// Require allowed domains to validate any forwarded headers - prevents trusting unvalidated headers
	if (!allowedDomains || allowedDomains.length === 0) {
		return result
	}

	// require a hostname
	if (!forwardedHost || forwardedHost.length === 0) {
		return result;
	}

	// Validate host (extract port from hostname for validation)
	// Reject empty strings and sanitize to prevent path injection
	const sanitized = sanitizeHost(forwardedHost);
	if (!sanitized) {
		return result;
	}
	const { hostname, port } = parseHost(sanitized);
	if (!hostname) {
		return result;
	}

	const testUrl = new URL(`https://${hostname}/`);
	// do not match anything other than hostname here.
	const found = allowedDomains.find((pattern) => matchHostname(testUrl, pattern.hostname, true));
	if (!found) {
		return result;
	}

	// we might need to set the port...
	// if allowedDomain specified a port, but none was found, reject all the headers.
	if (found.port) {
		if (port && found.port !== port) {
			return result;
		}
		if (forwardedPort && found.port !== forwardedPort) {
			return result;
		}
	}

	if (forwardedPort || port) {
		if (found.port) {
			if (port) {
				if (forwardedPort && forwardedPort !== port) {
					// weird case.
					return result;
				}
				if (found.port === port) {
					result.port = port;
				} else {
					return result
				}
			} else if (found.port === forwardedPort) {
					result.port = forwardedPort;
			} else {

				// found port but no match
				return result
			}
		} else {
			// If no port patterns, reject the header (strict security default)
		}
	}

	// if a protocol is configured, ensure it is correct.
	if (found.protocol) {
		if (found.protocol !== forwardedProtocol) {
			return result;
		}

		// all good
		result.protocol = found.protocol;
	} else if (forwardedProtocol && /^https?$/.test(forwardedProtocol)) {
		// fallback to allow if it is not specified in the allowedDomains, but only if it is http or https
		result.protocol = forwardedProtocol;
	}

	result.host = hostname;
	return result
}
