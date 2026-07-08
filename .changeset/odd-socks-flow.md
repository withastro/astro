---
'astro': patch
---

Fixes a bug where CSS `@import` rules could end up mid-stylesheet after inline CSS chunks were merged during build, causing browsers to silently ignore them
