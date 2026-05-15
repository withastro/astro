import { type RemotePattern } from '@astrojs/internal-helpers/remote';
/**
 * Parses a potentially comma-separated multi-value header (as produced by
 * proxy chains) and returns the first value, trimmed of whitespace.
 * Returns `undefined` when the header is absent or empty.
 */
export declare function getFirstForwardedValue(
	multiValueHeader: string | string[] | undefined,
): string | undefined;
/**
 * Validate a host against allowedDomains.
 * Returns the host only if it matches an allowed pattern; otherwise, undefined.
 * This prevents SSRF attacks by ensuring the Host header is trusted.
 */
export declare function validateHost(
	host: string | undefined,
	protocol: string,
	allowedDomains?: Partial<RemotePattern>[],
): string | undefined;
/**
 * Validate forwarded headers (proto, host, port) against allowedDomains.
 * Returns validated values or undefined for rejected headers.
 * Uses strict defaults: http/https only for proto, rejects port if not in allowedDomains.
 */
export declare function validateForwardedHeaders(
	forwardedProtocol?: string,
	forwardedHost?: string,
	forwardedPort?: string,
	allowedDomains?: Partial<RemotePattern>[],
): {
	protocol?: string;
	host?: string;
	port?: string;
};
