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

/**
 * Normalizes a URL pathname by decoding percent-encoded unreserved characters
 * (RFC 3986 section 2.3: A-Z a-z 0-9 - . _ ~) and normalizing encoded backslashes
 * (%5C → /) to prevent bypass attacks.
 *
 * Unlike `decodeURI()`, this function does NOT decode characters that are special in
 * URL contexts (like `%25` → `%`), which would produce invalid URLs. This prevents
 * middleware bypass attacks (e.g. `/%61dmin` → `/admin`) while keeping the URL valid.
 *
 * @param pathname - The URL pathname to normalize
 * @returns The normalized pathname
 */
export function normalizePathname(pathname: string): string {
	return pathname.replace(/%([0-9a-fA-F]{2})/g, (match, hex) => {
		const charCode = Number.parseInt(hex, 16);
		// Decode unreserved characters per RFC 3986:
		// ALPHA (A-Z, a-z), DIGIT (0-9), hyphen (-), period (.), underscore (_), tilde (~)
		if (
			(charCode >= 0x41 && charCode <= 0x5a) || // A-Z
			(charCode >= 0x61 && charCode <= 0x7a) || // a-z
			(charCode >= 0x30 && charCode <= 0x39) || // 0-9
			charCode === 0x2d || // -
			charCode === 0x2e || // .
			charCode === 0x5f || // _
			charCode === 0x7e // ~
		) {
			return String.fromCharCode(charCode);
		}
		// Normalize encoded backslash to forward slash (the URL spec treats \ as /
		// in paths, so %5C can be used to bypass middleware path checks)
		if (charCode === 0x5c) {
			return '/';
		}
		// Keep everything else encoded (%, /, #, ?, space, non-ASCII, etc.)
		return match;
	});
}
