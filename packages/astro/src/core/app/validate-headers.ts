import { matchPattern, type RemotePattern } from '@astrojs/internal-helpers/remote';

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

	// Validate protocol
	if (forwardedProtocol) {
		if (allowedDomains && allowedDomains.length > 0) {
			const hasProtocolPatterns = allowedDomains.some((pattern) => pattern.protocol !== undefined);
			if (hasProtocolPatterns) {
				// Only validate the protocol here; host+proto combination is checked in the host block below
				try {
					const testUrl = new URL(`${forwardedProtocol}://example.com`);
					const isAllowed = allowedDomains.some((pattern) =>
						matchPattern(testUrl, { protocol: pattern.protocol }),
					);
					if (isAllowed) {
						result.protocol = forwardedProtocol;
					}
				} catch {
					// Invalid protocol, omit from result
				}
			} else if (/^https?$/.test(forwardedProtocol)) {
				// allowedDomains exist but no protocol patterns, allow http/https
				result.protocol = forwardedProtocol;
			}
		} else if (/^https?$/.test(forwardedProtocol)) {
			// No allowedDomains, only allow http/https
			result.protocol = forwardedProtocol;
		}
	}

	// Validate port first
	if (forwardedPort && allowedDomains && allowedDomains.length > 0) {
		const hasPortPatterns = allowedDomains.some((pattern) => pattern.port !== undefined);
		if (hasPortPatterns) {
			// Validate against allowedDomains patterns
			const isAllowed = allowedDomains.some((pattern) => pattern.port === forwardedPort);
			if (isAllowed) {
				result.port = forwardedPort;
			}
		}
		// If no port patterns, reject the header (strict security default)
	}

	// Validate host (extract port from hostname for validation)
	// Reject empty strings and sanitize to prevent path injection
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
