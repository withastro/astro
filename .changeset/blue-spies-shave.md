---
'astro': minor
---

Redirects trailing slashes for on-demand pages

When the `trailingSlash` option is set to `always` or `never`, on-demand rendered pages will now redirect to the correct URL when the trailing slash is incorrect. This was previously the case for static pages, but now works for on-demand pages as well. It will also redirect when there are multiple trailing slashes for all trailing slash settings. For GET requests, the redirect will be a 301 (permanent) redirect, and for all other request methods, it will be a 308 (permanent, and preserve the request method) redirect.
