/**
 * Utilities for extracting information from `Request`
 */

import { isIP } from 'node:net';

// Parses multiple header and returns first value if available.
function getFirstForwardedValue(multiValueHeader?: string | string[] | null) {
	return multiValueHeader
		?.toString()
		?.split(',')
		.map((e) => e.trim())?.[0];
}

/**
 * Returns the first value associated to the `x-forwarded-for` header,
 * validated as a proper IPv4 or IPv6 address.
 *
 * @param {Request} request
 */
export function getClientIpAddress(request: Request): string | undefined {
	const ip = getFirstForwardedValue(request.headers.get('x-forwarded-for'));
	if (ip && isIP(ip)) {
		return ip;
	}
	return undefined;
}
