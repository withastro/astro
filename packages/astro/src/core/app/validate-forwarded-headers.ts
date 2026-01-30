import { matchPattern, type RemotePattern } from '@astrojs/internal-helpers/remote';

/**
 * Validate a hostname by rejecting any with path separators.
 * Prevents path injection attacks. Invalid hostnames return undefined.
 */
export function sanitizeHost(hostname: string | undefined): string | undefined {
	if (!hostname) return undefined;
	// Reject any hostname containing path separators - they're invalid
	if (/[/\\]/.test(hostname)) return undefined;
	return hostname;
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
				// Validate against allowedDomains patterns
				try {
					const testUrl = new URL(`${forwardedProtocol}://example.com`);
					const isAllowed = allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
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
			try {
				// Extract hostname without port for validation
				const hostnameOnly = sanitized.split(':')[0];
				// Use full hostname:port for validation so patterns with ports match correctly
				// Include validated port if available, otherwise use port from forwardedHost if present
				const portFromHost = sanitized.includes(':') ? sanitized.split(':')[1] : undefined;
				const portForValidation = result.port || portFromHost;
				const hostWithPort = portForValidation
					? `${hostnameOnly}:${portForValidation}`
					: hostnameOnly;
				const testUrl = new URL(`${protoForValidation}://${hostWithPort}`);
				const isAllowed = allowedDomains.some((pattern) => matchPattern(testUrl, pattern));
				if (isAllowed) {
					result.host = sanitized;
				}
			} catch {
				// Invalid host, omit from result
			}
		}
	}

	return result;
}
