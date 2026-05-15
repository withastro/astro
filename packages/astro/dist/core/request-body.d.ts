/**
 * Shared utility for reading request bodies with a size limit.
 * Used by both Actions and Server Islands to enforce `security.actionBodySizeLimit`
 * and `security.serverIslandBodySizeLimit` respectively.
 */
/**
 * Read the request body as a `Uint8Array`, enforcing a maximum size limit.
 * Checks the `Content-Length` header for early rejection, then streams the body
 * and tracks bytes received.
 *
 * @throws {BodySizeLimitError} if the body exceeds the configured limit
 */
export declare function readBodyWithLimit(request: Request, limit: number): Promise<Uint8Array>;
export declare class BodySizeLimitError extends Error {
	limit: number;
	constructor(limit: number);
}
