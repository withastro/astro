---
'@astrojs/vercel': patch
---

Fixes ISR routes serving a cached redirect to a nonsense path (`/$0/`) when Vercel fails to substitute the undocumented `$0` capture group reference in route rewrites. The route patterns are now wrapped in an explicit capture group referenced as `$1`, and the adapter entrypoint returns a 404 for a trusted path override that is missing or doesn't start with `/`, instead of falling through to the internal `/_isr` path.