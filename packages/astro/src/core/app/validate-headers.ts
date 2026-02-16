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

	let allowedDomain: RemotePattern = {}

	// Validate host (extract port from hostname for validation)
	// Reject empty strings and sanitize to prevent path injection
	if (forwardedHost && forwardedHost.length > 0) {
		const sanitized = sanitizeHost(forwardedHost);
		if (sanitized) {
			const { hostname, port } = parseHost(sanitized);
			if (hostname) {
				const testUrl = new URL(`https://${hostname}/`);
				// do not match anything other than hostname here.
				const found = allowedDomains.find((pattern) => matchHostname(testUrl, pattern.hostname, true));
				if (found) {
					// also check for ports in the forwarded header, if there is a mismatch, return
					if (port) {
						if (found.port && found.port !== port) {
							return result;
						}
					}
					result.host = sanitized;
					allowedDomain = found
				}
			}
		}
	}

	// If host is not valid, we cannot trust protocol or port from forwarded headers
	if (!result.host || !allowedDomain.hostname) {
		return result;
	}

	// Validate port
	if (forwardedPort && allowedDomain.port && allowedDomain.port === forwardedPort) {
		result.port = forwardedPort;
	}

	// Validate protocol
	if (forwardedProtocol) {
		if (allowedDomain.protocol) {
			if (allowedDomain.protocol === forwardedProtocol) {
				result.protocol = forwardedProtocol;
			}
		} else if (/^https?$/.test(forwardedProtocol)) {
			// allowdDomains does not contain protocol, allow protocol
			result.protocol = forwardedProtocol;
		}
	}

	return result;
}
