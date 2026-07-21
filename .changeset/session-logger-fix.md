---
'astro': patch
---

Routes session runtime diagnostics through `AstroLogger` instead of `console.error` to respect user logging configuration. Also resets the internal `#partial` flag after a storage failure during `regenerate()` to prevent unnecessary storage round-trips on subsequent reads.
