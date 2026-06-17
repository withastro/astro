const MAX_DECODE_ITERATIONS = 10;

/**
 * Decodes a pathname to its canonical form.
 * This prevents middleware/routing mismatches caused by partially decoded paths.
 *
 * @param pathname - The pathname to validate
 * @returns The canonical decoded pathname
 * @throws Error if the pathname has invalid encoding or too many levels of encoding
 */
export function validateAndDecodePathname(pathname: string): string {
	let decoded = pathname;

	for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) {
		let next: string;
		try {
			next = decodeURI(decoded);
		} catch (_e) {
			throw new Error('Invalid URL encoding');
		}

		if (next === decoded) {
			return decoded;
		}

		decoded = next;
	}

	throw new Error('Multi-level URL encoding is not allowed');
}
