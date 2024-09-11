---
'astro': minor
---

Adds a new `buildOutput` property to the `astro:config:done` hook returning the build output type.

This can be used to know if the user's project will be built as a static site (HTML files), or a server-rendered site (whose exact output depends on the adapter).
