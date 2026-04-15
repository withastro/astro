---
'astro': patch
---

Fixes the `/_image` endpoint accepting an arbitrary `f=svg` query parameter and serving non-SVG content as `image/svg+xml`. The endpoint now validates that the source is actually SVG before honoring `f=svg`, matching the same guard already enforced on the `<Image>` component path.
