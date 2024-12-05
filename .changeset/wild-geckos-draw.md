---
'astro': patch
---

Fix use of cloned requests in middleware with clientAddress

When using `context.clientAddress` or `Astro.clientAddress` Astro looks up the address in a hidden property. Cloning a request can cause this hidden property to be lost.

The fix is to pass the address as an internal property instead, decoupling it from the request.
