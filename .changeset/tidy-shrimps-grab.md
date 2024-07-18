---
'astro': patch
---

Fix for Server Islands in Vercel adapter

Vercel, and probably other adapters only allow pre-defined routes. This makes it so that the `astro:build:done` hook includes the `_server-islands/` route as part of the route data, which is used to configure available routes.
