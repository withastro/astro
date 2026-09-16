---
'astro': minor
---

Adds `experimental.redirectPage`, letting you provide your own `src/pages/3xx.astro` in place of the redirect page Astro generates in static builds.

A static site has no server to send an HTTP `Location` header, so Astro generates a small HTML page with a `<meta http-equiv="refresh">` tag for each redirect it builds:

- Your [`redirects`](https://docs.astro.build/en/reference/configuration-reference/#redirects) entries
- `Astro.redirect()` calls in prerendered pages
- i18n redirects.

That page's markup, wording, and refresh delay were fixed, so you could not brand or translate it.

To enable this feature, add the experimental flag to your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    redirectPage: true,
  },
});
```

Then create `src/pages/3xx.astro`. Astro renders it once per redirect, passing that redirect's details as props:

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
