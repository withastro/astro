---
'@astrojs/node': minor
---

Adds new middleware mode "on-request".

This value allows you to control when Astro's middleware is applied. Before, middleware would run on request for dynamic pages, and during build for static pages. You can now choose from the following modes by setting the `middlewareMode` in your adapter settings. Support depends on the adapter.

| Mode | Build-time (prerendered pages) | Request-time (SSR pages) | Request-time (prerendered pages) | Use case |
|------|:---:|:---:|:---:|---------|
| `"classic"` (default) | ✅ | ✅ | ❌ | Today's default. Middleware affects static pages only at build time. |
| `"on-request"` | ❌ | ✅ | ✅ | Middleware only runs at request time. For runtime-only concerns (auth headers, sessions). |
