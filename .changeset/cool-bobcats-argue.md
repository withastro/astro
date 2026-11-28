---
'astro': patch
---

Fixes custom `500.astro` pages being streamed when rendered for a thrown error, even when the app was created with streaming disabled (for example via `@astrojs/node`'s `experimentalDisableStreaming` option)
