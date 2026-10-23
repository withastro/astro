---
'astro': patch
---

CSP no longer hashes empty children on external stylesheets and scripts, which was inserting the SHA-256 of the empty string into `script-src` and `style-src`.
