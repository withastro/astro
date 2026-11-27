---
'astro': patch
'@astrojs/runtime': patch
---

Fixes prerendered pages with server islands producing different HTML on every build. When `ASTRO_KEY` is set, building the same source now gives the same server island output, so deploy tools that skip unchanged files no longer re-upload every page. Adapters that add a per-deploy header to server island requests, such as Netlify, or Vercel with skew protection, still change the output on each deploy. Pages rendered on demand still encrypt server island data with a random IV.
