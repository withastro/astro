---
'@astrojs/node': patch
---

Fixes a bug where the trailing slash redirect dropped part of the query string when it contained a second `?`, for example `?redirect=/page?id=1`.
