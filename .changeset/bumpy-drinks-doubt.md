---
'astro': patch
---

Fixes a CSP violation when using both `security.csp` and `experimental.clientPrerender` with `data-astro-prefetch` links. The dynamically injected `<script type="speculationrules">` now uses a static `"source": "document"` approach with a CSS selector, producing a deterministic payload that is hashed and included in the CSP `script-src` directive at build time.
