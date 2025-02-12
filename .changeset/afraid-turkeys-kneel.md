---
'astro': minor
---

Provide default implementation for `HEAD` requests for endpoints which not explicitly implemented it

If an endpoint defines a `GET` handler but no specific handler for `HEAD`, Astro will now call the `GET` handler and return the headers and status but an empty body. 
If you would like to have custom handling for `HEAD` requests you can define a handler for it and it will use that instead.
