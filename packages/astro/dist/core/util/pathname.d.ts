/**
 * Error thrown when multi-level URL encoding is detected in a pathname.
 * This is a distinct error type so callers can handle it specifically
 * (e.g., returning a 400 response) rather than falling back to partial decoding.
 */
export declare class MultiLevelEncodingError extends Error {
	constructor();
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
export declare function validateAndDecodePathname(pathname: string): string;
