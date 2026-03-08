/**
 * Utilities for extracting information from `Request`
 */

// Parses multiple header and returns first value if available.
export function getFirstForwardedValue(multiValueHeader?: string | string[] | null) {
	return multiValueHeader
		?.toString()
		?.split(',')
		.map((e) => e.trim())?.[0];
}

// Character-allowlist for IP addresses. Rejects injection payloads (HTML, SQL,
// path traversal, etc.) while accepting any well-formed IPv4/IPv6 string.
//
// Allowed characters:
//   0-9    digits (IPv4 octets, IPv6 groups)
//   a-fA-F hex digits (IPv6)
//   .      dot separator (IPv4, IPv4-mapped IPv6)
//   :      colon separator (IPv6)
//
// Max length 45 covers the longest valid representation
// (full IPv6 with IPv4-mapped suffix is 45 chars).
const IP_RE = /^[0-9a-fA-F.:]{1,45}$/;

/**
 * Checks whether a string looks like an IP address (contains only characters
 * that can appear in IPv4/IPv6 addresses and is within a reasonable length).
 *
 * This is a permissive allowlist — it won't catch every malformed IP, but it
 * reliably rejects injection payloads. Does NOT use Node.js APIs so it works
 * in all runtimes (Workers, Deno, etc.).
 */
export function isValidIpAddress(value: string): boolean {
	return IP_RE.test(value);
}

/**
 * Extracts the first value from a potentially multi-value header and validates
 * that it is a syntactically valid IP address.
 *
 * Useful for adapters that read client IP from a platform-specific header
 */
export function getValidatedIpFromHeader(
	headerValue: string | string[] | null | undefined,
): string | undefined {
	const raw = getFirstForwardedValue(headerValue);
	if (raw && isValidIpAddress(raw)) {
		return raw;
	}
	return undefined;
}

/**
 * Returns the first value associated to the `x-forwarded-for` header,
 * but only if it is a valid IP address. Returns `undefined` otherwise.
 *
 * @param {Request} request
 */
export function getClientIpAddress(request: Request): string | undefined {
	return getValidatedIpFromHeader(request.headers.get('x-forwarded-for'));
}
