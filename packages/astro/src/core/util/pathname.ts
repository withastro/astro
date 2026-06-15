/**
 * Error thrown when multi-level URL encoding is detected in a pathname.
 * This is a distinct error type so callers can handle it specifically
 * (e.g., returning a 400 response) rather than falling back to partial decoding.
 *
 * @deprecated No longer thrown internally — multi-level encoding is now
 * decoded iteratively instead of rejected. Kept for backwards compatibility
 * in case third-party code references the class.
 */
export class MultiLevelEncodingError extends Error {
	constructor() {
		super('Multi-level URL encoding is not allowed');
		this.name = 'MultiLevelEncodingError';
	}
}

/**
 * Decodes a pathname iteratively until stable, collapsing all levels of
 * percent-encoding into a single canonical form. This prevents
 * double/triple encoding from bypassing middleware authorization checks
 * (CVE-2025-66202) — instead of rejecting multi-level encoding, we
 * fully resolve it so middleware always sees the true decoded path.
 *
 * @param pathname - The pathname to decode
 * @returns The fully decoded pathname
 * @throws Error if the pathname contains invalid URL encoding that
 *   cannot be decoded at all (e.g., a bare `%` not followed by hex digits)
 */
export function validateAndDecodePathname(pathname: string): string {
	let decoded: string;
	try {
		decoded = decodeURI(pathname);
	} catch (_e) {
		throw new Error('Invalid URL encoding');
	}
	// Iteratively decode until stable. Multi-level encoding (e.g.,
	// %2561 → %61 → a) is resolved completely so that downstream code
	// — especially middleware auth checks — always sees the canonical
	// pathname regardless of how many encoding layers the client used.
	// We cap iterations to prevent infinite loops on pathological input.
	let iterations = 0;
	while (decoded !== pathname && iterations < 10) {
		pathname = decoded;
		try {
			decoded = decodeURI(pathname);
		} catch {
			// decodeURI can fail when a decoded literal '%' forms an
			// invalid sequence with adjacent characters (e.g., '%?.pdf'
			// after decoding %25%3F). This is fine — we've decoded as
			// far as possible.
			break;
		}
		iterations++;
	}
	return decoded;
}
