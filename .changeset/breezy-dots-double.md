---
'astro': patch
---

Fixes static builds skipping or failing on pages whose `getStaticPaths()` params contain characters like `%` or `\`, and warns when a prerendered page is skipped because it returned an empty error response
