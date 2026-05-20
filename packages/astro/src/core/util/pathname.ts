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

const ENCODING_REGEX = /%25[0-9a-fA-F]{2}/;

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
	// %25 (encoded %) followed by two hex digits is the signature of double-encoding.
	// Example: %2561 is %25 + 61, which decodes to %61, then to 'a'.
	// This is ambiguous with a literal "%" followed by hex characters (e.g. a file
	// named "%AB"), but rejecting it is the secure default — the alternative allows
	// middleware auth bypasses.
	if (ENCODING_REGEX.test(pathname)) {
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
	if (ENCODING_REGEX.test(decoded)) {
		throw new MultiLevelEncodingError();
	}
	return decoded;
}
