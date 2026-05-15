/**
 * Utilities for extracting information from `Request`
 */
export declare function getFirstForwardedValue(
	multiValueHeader?: string | string[] | null,
): string | undefined;
/**
 * Checks whether a string looks like an IP address (contains only characters
 * that can appear in IPv4/IPv6 addresses and is within a reasonable length).
 *
 * This is a permissive allowlist — it won't catch every malformed IP, but it
 * reliably rejects injection payloads. Does NOT use Node.js APIs so it works
 * in all runtimes (Workers, Deno, etc.).
 */
export declare function isValidIpAddress(value: string): boolean;
/**
 * Extracts the first value from a potentially multi-value header and validates
 * that it is a syntactically valid IP address.
 *
 * Useful for adapters that read client IP from a platform-specific header
 */
export declare function getValidatedIpFromHeader(
	headerValue: string | string[] | null | undefined,
): string | undefined;
/**
 * Returns the first value associated to the `x-forwarded-for` header,
 * but only if it is a valid IP address. Returns `undefined` otherwise.
 *
 * @param {Request} request
 */
export declare function getClientIpAddress(request: Request): string | undefined;
