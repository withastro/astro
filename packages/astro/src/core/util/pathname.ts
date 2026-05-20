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

const ENCONDING_REGEX = /%25[0-9a-fA-F]{2}/;

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
	if (ENCONDING_REGEX.test(pathname)) {
		throw new MultiLevelEncodingError();
	}
	let decoded: string;
	try {
		decoded = decodeURI(pathname);
	} catch (_e) {
		throw new Error('Invalid URL encoding');
	}
	// Defense-in-depth: catch creative encodings that reassemble
	// into %25HH after the first decode pass
	if (ENCONDING_REGEX.test(decoded)) {
		throw new MultiLevelEncodingError();
	}
	return decoded;
}
