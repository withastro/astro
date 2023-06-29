---
'astro': minor
---

Astro now exposes a utility called `trySerializeLocals` via `astro/middleware` module.

This utility can be used by adapters to validate their `locals` before being sent 
to the Astro middleware.

This function will throw a runtime error if the value passed is not serializable, so
consumers will need to handle that error.
