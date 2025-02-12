---
'astro': minor
---

Handle `HEAD` requests to an endpoint when a handler is not defined.

If an endpoint defines a handler for `GET`, but does not define a handler for `HEAD`, Astro will call the `GET` handler and return the headers and status but an empty body.
