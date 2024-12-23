---
'astro': patch
---

Fixes an issue where an injected route entrypoint wasn't correctly marked because the resolved file path contained a query parameter.

This fixes some edge case where some injected entrypoint were not resolved when using an adapter.
