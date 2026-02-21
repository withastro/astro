---
'astro': patch
---

Improves `.astro` component SSR rendering performance by up to 2x

Refactors the internal rendering pipeline to avoid unnecessary object allocations and reduce overhead in hot paths:

- Replaces `Object.prototype.toString.call()` with `instanceof` for HTML string detection
- Reorders the `renderChild` type dispatch to check strings first (most common case)
- Eliminates O(N²) head element deduplication by using a `Set`
- Renders array children and template expressions directly to the destination without buffering when all children are synchronous, falling back to buffered rendering only when a `Promise` is encountered

These changes are internal optimizations with no effect on the public API or rendered output.
