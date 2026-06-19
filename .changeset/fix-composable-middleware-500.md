---
'astro': patch
---

Fixes a bug where the advanced routing `astro/hono` / `astro/fetch` `middleware()` handler returned the host framework's default `Internal Server Error` response instead of rendering the custom `500.astro` page when middleware threw. Unmatched requests with a prerendered (or absent) custom 404 page now render the 404 error page instead of failing the same way. Errors surfaced through `next` (the host framework's downstream chain) still propagate to the host's own error handler.
