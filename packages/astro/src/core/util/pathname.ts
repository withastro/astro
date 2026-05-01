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
	let decoded: string;

	try {
		decoded = decodeURI(pathname);
	} catch (_e) {
		throw new Error('Invalid URL encoding');
	}

	// Check if the decoded path is different from the original
	// AND still contains URL-encoded sequences.
	// This indicates the original had encoding that got partially decoded, suggesting double encoding.
	// Example: /%2561dmin -> decodeURI -> /%61dmin (different AND still has %)
	const hasDecoding = decoded !== pathname;
	const decodedStillHasEncoding = /%[0-9a-fA-F]{2}/.test(decoded);

	if (hasDecoding && decodedStillHasEncoding) {
		throw new MultiLevelEncodingError();
	}

	return decoded;
}
