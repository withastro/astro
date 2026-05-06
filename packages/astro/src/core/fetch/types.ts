/**
 * A framework-agnostic request handler. Takes a standard `Request` and
 * returns a `Response`. This mirrors the Web Fetch API handler shape, which
 * lets handlers compose easily with other middleware systems later.
 */
export type FetchHandler = (request: Request) => Promise<Response>;
