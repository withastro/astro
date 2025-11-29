/**
 * Validates that a pathname is not multi-level encoded.
 * Detects if a pathname contains encoding that was encoded again (e.g., %2561dmin where %25 decodes to %).
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
		throw new Error('Multi-level URL encoding is not allowed');
	}

	return decoded;
}
