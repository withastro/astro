---
'@astrojs/node': minor
---

Adds support for specifying a host to load prerendered error pages

By default, if a user defines a custom error page that is prerendered, Astro will load it from the same host as the one that the request is made to. This change allows users to specify a different host for loading prerendered error pages. This can be useful in scenarios such as where the server is running behind a reverse proxy or when prerendered pages are hosted on a different domain.

To use this feature, set the `experimentalErrorPageHost` adapter option in your Astro configuration to the desired host URL. For example, if your server is running on localhost and served via a proxy, you can ensure the prerendered error pages are fetched via the localhost URL:

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
export default defineConfig({
  adapter: node({
    // If your server is running on localhost and served via a proxy, set the host like this to ensure prerendered error pages are fetched via the localhost URL
    experimentalErrorPageHost: 'http://localhost:4321',
  })
});
```

For more information on enabling and using this experimental feature, see the [`@astrojs/node` adapter docs](https://docs.astro.build/en/guides/integrations-guide/node/#experimentalerrorpagehost).
