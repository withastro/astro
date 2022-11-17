---
'@astrojs/node': minor
---

Sometimes Astro sends a ReadableStream as a response and it raise an error **TypeError: body is not async iterable.**

I added a function to get a response iterator from different response types (sourced from apollo-client).

With this, node adapter can handle all the Astro response types.
