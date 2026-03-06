---
'astro': patch
---

Fixes `Astro.rewrite` returning 404 when rewriting to a URL with non-ASCII characters

When rewriting to a path containing non-ASCII characters (e.g., `/redirected/héllo`), the route lookup compared encoded `distURL` hrefs against decoded pathnames, causing the comparison to always fail and resulting in a 404. This fix compares against the encoded pathname instead.
