/**
 * Validates that a pathname is not multi-level encoded.
 * After decoding once, the result should contain no URL-encoded sequences (%XX).
 * This prevents double/triple encoding bypasses of security checks.
 *
 * @param pathname - The pathname to validate
 * @returns The decoded pathname if valid
 * @throws Error if multi-level encoding is detected
 */
export function validateAndDecodePathname(pathname: string): string {
	let decoded: string;

	try {
		decoded = decodeURI(pathname);
	} catch (e) {
		throw new Error('Invalid URL encoding');
	}

	// Check if decoded path still contains URL-encoded sequences
	// Matches % followed by exactly two hexadecimal digits
	if (/%[0-9a-fA-F]{2}/.test(decoded)) {
		throw new Error('Multi-level URL encoding is not allowed');
	}

	return decoded;
}
