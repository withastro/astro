---
'astro': patch
---

Improves error message when a dynamic redirect destination does not match any existing route.

Previously, configuring a redirect like `/categories/[category]` → `/categories/[category]/1` in static output mode would fail with a misleading "getStaticPaths required" error. Now, Astro detects this early and provides a clear error explaining that the destination does not match any existing route.
