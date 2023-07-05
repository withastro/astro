---
'astro': minor
---

The `astro/middleware` module exports a new utility called `trySerializeLocals`.

This utility can be used by adapters to validate their `locals` before sending it 
to the Astro middleware.

This function will throw a runtime error if the value passed is not serializable, so
consumers will need to handle that error.
