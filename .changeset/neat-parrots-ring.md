---
'astro': patch
---

Fixes a bug where `<Picture inferSize>` with a remote image could fail with `FailedToFetchRemoteImageDimensions` when the image server rate-limits requests (e.g. HTTP 429). Remote dimensions are now resolved once per render instead of once per output format.
