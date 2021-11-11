---
'astro': patch
---

Provides first-class support for a site deployed to a subpath

Now you can deploy your site to a subpath more easily. Astro will use your `buildOptions.site` URL and host the dev server from there.

If your site config is `http://example.com/blog` you will need to go to `http://localhost:3000/blog/` in dev and when using `astro preview`.

Includes a helpful 404 page when encountering this in dev and preview.