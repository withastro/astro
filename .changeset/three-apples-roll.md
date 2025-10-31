---
'astro': patch
---

Fixes a case where the experimental Fonts API would filter available font files too aggressively, which could prevent the download of woff files when using the google provider
