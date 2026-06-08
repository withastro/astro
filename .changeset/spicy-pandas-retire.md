---
'astro': patch
---

Reverts a change to `isNode` runtime detection that caused a significant build time regression for Cloudflare adapter users with large prerendered sites
