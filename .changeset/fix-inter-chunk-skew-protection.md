---
'astro': patch
---

Fixes skew protection query parameters not being appended to inter-chunk JavaScript imports in client bundles, which could cause version mismatches during rolling deployments on Vercel
