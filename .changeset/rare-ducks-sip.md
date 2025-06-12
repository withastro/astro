---
'astro': patch
---

Adds a new Astro Adapter Feature called `experimentalStaticHeaders` to allow your adapter to control serving CSP in static pages.

For adapters that enable support for this feature, Astro will not serve the CSP `<meta http-equiv="content-security-policy">` element in static pages.

Instead, Astro will serve the value of the header inside a map that can be retrieved from the hook `astro:build:generated`. Adapters can read this mapping and use their hosting headers capabilities to create a configuration file.

The name of the new field is called `experimentalRouteToHeaders` and it contains a map of `Map<IntegrationResolvedRoute, Headers>` where
the `Headers` contain the headers emitted during the rendering of the static pages.

A new field called `experimentalRouteToHeaders` will contain a map of `Map<IntegrationResolvedRoute, Headers>` where the `Headers` type contains the headers emitted by the rendered static route. 

To enable support for this experimental Astro Adapter Feature, add it to your `supportedAstroFeatures` in your adapter config:

```js
// my-adapter.mjs
export default function createIntegration() {
  return {
    name: '@example/my-adapter',
    hooks: {
      'astro:config:done': ({ setAdapter }) => {
        setAdapter({
          name: '@example/my-adapter',
          serverEntrypoint: '@example/my-adapter/server.js',
          adapterFeatures: {
            experimentalRouteToHeaders: true
          }
        });
      },
    },
  };
}
```

To use this adapter feature, users must also have the `experimental.csp` feature flag set in their Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    csp: true,
  },
});
```
