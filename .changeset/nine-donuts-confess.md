---
'astro': patch
---

Improve suppport for `import.meta.env`.

Prior to this change, all variables defined in `.env` files had to include the `PUBLIC_` prefix, meaning that they could potentially be visible to the client if referenced. 

Now, Astro includes _any_ referenced variables defined in `.env` files on `import.meta.env` during server-side rendering, but only referenced `PUBLIC_` variables on the client.
