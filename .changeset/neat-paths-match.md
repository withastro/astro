---
'@astrojs/netlify': patch
---

Fixes Netlify Image CDN patterns generated from `image.remotePatterns` pathnames ending in `/**` so they only match paths below that directory, consistent with Astro's own pattern matching. Previously, a pattern like `/public/**` also matched sibling paths sharing the prefix, such as `/public-assets/`.
