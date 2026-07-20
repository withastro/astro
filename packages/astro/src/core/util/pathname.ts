/**
 * Thrown when a URL path is encoded so many times that we give up decoding it
 * (see {@link validateAndDecodePathname}). When this happens we reject the
 * request with a `400` instead of guessing the path. If we let a half-decoded
 * path through, your middleware might check one path while Astro routes to a
 * different one.
 */
export class MultiLevelEncodingError extends Error {
	constructor() {
		super('URL encoding depth exceeded the maximum number of decode iterations');
		this.name = 'MultiLevelEncodingError';
	}
}

/**
 * How many times {@link validateAndDecodePathname} will decode a path before
 * giving up. A normal URL is encoded once, or at most twice — for example a
 * `[` (`%5B`) can arrive as `%255B` when a link is built from a value that was
 * already encoded. A path that is still encoded after this many tries is
 * almost certainly an attack, so we reject it instead of decoding again.
 */
const MAX_DECODE_ITERATIONS = 10;

/**
 * Decodes a URL path over and over until it stops changing, so a path that was
 * encoded several times ends up as a single, final path. This stops someone
 * from sneaking a path like `/admin` past middleware by encoding it multiple
 * times — middleware always sees the real, decoded path.
 *
 * @param pathname - The path to decode
 * @returns The final, fully decoded path
 * @throws Error if the path has broken encoding that can't be decoded at all
 *   (for example a lone `%` that isn't followed by two hex digits)
 * @throws MultiLevelEncodingError if the path is still changing after
 *   {@link MAX_DECODE_ITERATIONS} tries (it was encoded too many times).
 *   Handing back a half-decoded path here would bring back the security hole
 *   this function exists to close.
 */
export function validateAndDecodePathname(pathname: string): string {
	let decoded: string;
	try {
		decoded = decodeURI(pathname);
	} catch (_e) {
		throw new Error('Invalid URL encoding');
	}
	// Keep decoding until the path stops changing. A path can be encoded more
	// than once (for example %2561 → %61 → a), and we want the final decoded
	// path so the rest of Astro — especially middleware security checks —
	// always sees the same real path, no matter how many times it was encoded.
	let iterations = 0;
	while (decoded !== pathname) {
		// The path is still changing after the maximum number of tries, so it
		// was encoded too many times for us to fully decode. Stop and reject
		// it: handing back a half-decoded path could let middleware check one
		// path while a later decode (during rewrite routing) turns it into a
		// different, possibly protected, path.
		if (iterations >= MAX_DECODE_ITERATIONS) {
			throw new MultiLevelEncodingError();
		}
		pathname = decoded;
		try {
			decoded = decodeURI(pathname);
		} catch {
			// decodeURI throws when decoding leaves a real '%' next to
			// characters that look like broken encoding (for example '%?.pdf'
			// after decoding %25%3F). That's fine — we've decoded as far as we
			// can and the path won't change any further.
			break;
		}
		iterations++;
	}
	return decoded;
}
