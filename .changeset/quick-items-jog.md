---
'@astrojs/cloudflare': patch
---

Now building for Cloudflare directory mode takes advantage of the standard asset handling from Cloudflare Pages, and therefore does not call a function script to deliver static assets anymore.
Also supports the use of `_routes.json`, `_redirects` and `_headers` files when placed into the `public` folder.