---
'astro': patch
---

Session runtime warnings are now routed through Astro's structured logger instead of `console.error`, so they respect your configured log level and appear in custom log sinks. Additionally, a session that fails to load during `regenerate()` is no longer left in a partial state, preventing unnecessary storage reads on subsequent operations.
