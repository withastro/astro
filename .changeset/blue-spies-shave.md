---
'astro': minor
---

Redirects trailing slashes for on-demand pages

When the `trailingSlash` option is set to `always` or `never`, on-demand rendered pages will now redirect to the correct URL when the trailing slash is incorrect. This was previously the case for static pages, but now works for on-demand pages as well.
