/**
 * Vendored from deterministic-object-hash@2.0.2 (MIT)
 * https://github.com/nicholasgasior/deterministic-object-hash
 *
 * Only `deterministicString` is needed - the async `deterministicHash` (which
 * pulls in `node:crypto`) is intentionally excluded so this module stays
 * runtime-agnostic (works in Node, workerd, browsers, etc.).
 */
/** Recursively serializes any JS value into a deterministic string. */
export declare function deterministicString(input: unknown): string;
