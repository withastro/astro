---
'astro': patch
---

Fixes late `Astro.cache.set()` directives in layouts and components for `memoryCache()` GET responses already marked cacheable with a positive `maxAge`. Late tags, lifetimes, and opt-outs are collected before applying cache headers and deciding whether to store the response, while preserving Astro cookies.

Other runtime providers can opt into this behavior with `shouldBufferResponse(response, request)`. Providers that stream or write in the background remain unbuffered by default. Opting in waits for the complete response body and must not be used for infinite streams. The memory provider preserves pass-through streaming for responses already known to be uncacheable because of cookies or `Vary`.

With CDN providers, streaming still finalizes HTTP cache headers before async layouts or components may run. Set directives and opt-outs in page frontmatter or middleware, or use `experimentalDisableStreaming: true` to collect directives from the entire tree. First opting into caching with a late layout-only `maxAge` remains unsupported while streaming.
