---
'@astrojs/vercel': patch
---

Fixes ISR routes using the undocumented `$0` capture group reference in Vercel route rewrites. Replaces it with `$1` via an explicit capture group, and validates that the path override starts with `/` before accepting it.
