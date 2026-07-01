---
'astro': patch
---

Fixes `inferSize` failing on the `Picture` component with certain remote image URLs due to redundant HTTP requests triggering rate limiting (HTTP 429). Remote image probe results are now cached by URL, so the same image is only fetched once regardless of how many format variants the `Picture` component generates.
