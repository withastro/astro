---
'astro': patch
---

Fixes AVIF images served by the `/_image` endpoint (e.g. in `astro dev`) having an `image/heif` Content-Type instead of `image/avif`
