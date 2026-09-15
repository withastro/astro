---
'astro': minor
---

Adds experimental support for a custom redirect page via the `redirectPage` flag

A static site cannot send an HTTP `Location` header, so Astro writes a small HTML page containing a `<meta http-equiv="refresh">` tag for every redirect a static build produces: entries in [`redirects`](https://docs.astro.build/en/reference/configuration-reference/#redirects), `Astro.redirect()` calls in prerendered pages, and i18n redirects. Until now that page's markup, wording, and refresh delay were fixed.

To enable this feature, add the experimental flag `redirectPage` to your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    redirectPage: true,
  },
});
```

Then create `src/pages/3xx.astro`. Astro renders it in place of the built-in page, passing the details of each redirect as props:

```astro
---
// src/pages/3xx.astro
const { from, to, status, delay } = Astro.props;
---

<html lang="en">
  <head>
    <meta http-equiv="refresh" content={`${delay};url=${to}`} />
    <meta name="robots" content="noindex" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>This page has moved. <a href={to}>Continue to {to}</a>.</p>
  </body>
</html>
```

Your page must render a `<meta http-equiv="refresh">` tag pointing at `to`, because in a static build that tag is the redirect. Astro logs a warning during the build if it is missing.

See the [experimental redirect page documentation](https://docs.astro.build/en/reference/experimental-flags/redirect-page/) for more information.
