/**
 * Error thrown when multi-level URL encoding is detected in a pathname.
 * This is a distinct error type so callers can handle it specifically
 * (e.g., returning a 400 response) rather than falling back to partial decoding.
 */
export class MultiLevelEncodingError extends Error {
	constructor() {
		super('Multi-level URL encoding is not allowed');
		this.name = 'MultiLevelEncodingError';
	}
}

/**
 * Validates that a pathname is not multi-level encoded.
 * Detects if a pathname contains encoding that was encoded again (e.g., %2561dmin where %25 decodes to %).
 * This prevents double/triple encoding bypasses of security checks.
 *
 * @param pathname - The pathname to validate
 * @returns The decoded pathname if valid
 * @throws MultiLevelEncodingError if multi-level encoding is detected
 * @throws Error if the pathname contains invalid URL encoding
 */
export function validateAndDecodePathname(pathname: string): string {
	// Multi-level encoding signature: `%25` (encoded `%`) followed by a hex pair.
	// After one decode pass, `%25XY` becomes `%XY`, which a downstream decoder
	// could turn into the original byte — bypassing middleware checks against
	// the final-decoded value (e.g. `%2561dmin` -> `%61dmin` -> `admin`).
	//
	// A `%25` followed by a non-hex character — including another `%` (as in
	// `%25%3F` from `encodeURIComponent('%?')`) — is a legitimate literal `%`
	// next to other encoded content, not multi-level encoding.
	if (/%25[0-9a-fA-F]{2}/.test(pathname)) {
		throw new MultiLevelEncodingError();
	}

	try {
		return decodeURI(pathname);
	} catch (_e) {
		throw new Error('Invalid URL encoding');
	}
}
