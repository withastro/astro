---
'astro': patch
---

Improves streaming SSR performance by optimizing buffer management in `renderToAsyncIterable`.

String chunks are now accumulated during the write phase and encoded to `Uint8Array` in bulk, replacing the previous O(N²) rescan-and-merge in `next()` with O(N) concatenation. This reduces `TextEncoder.encode()` calls and simplifies the merge loop. Streaming-heavy pages see up to 17% improvement (.md), with 3-14% gains across component-heavy and expression-heavy pages.
