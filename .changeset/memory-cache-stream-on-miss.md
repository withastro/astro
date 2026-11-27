---
'astro': patch
---

Streams the page to the visitor on a cache miss in the built-in memory cache provider (`memoryCache()`), instead of waiting for the whole page to render before sending the first byte. The rendered page is still stored once it completes, and a response that fails mid-stream is not stored. As on an uncached page, a rendering error once the page has started streaming ends the response instead of showing the 500 error page.
