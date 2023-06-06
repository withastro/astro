---
'astro': minor
---

Experimental redirects support

This change adds support for the redirects RFC, currently in stage 3: https://github.com/withastro/roadmap/pull/587

Now you can specify redirects in your Astro config:

```js
import { defineConfig } from 'astro/config';

export defineConfig({
  redirects: {
    '/blog/old-post': '/blog/new-post'
  }
});
```

You can also specify spread routes using the same syntax as in file-based routing:

```js
import { defineConfig } from 'astro/config';

export defineConfig({
  redirects: {
    '/blog/[...slug]': '/articles/[...slug]'
  }
});
```

By default Astro will build HTML files that contain the `<meta http-equiv="refresh">` tag. Adapters can also support redirect routes and create configuration for real HTTP-level redirects in production.
