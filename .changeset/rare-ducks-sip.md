---
'astro': patch
---

Adds a new **experimental** Astro Adapter Feature called `_experimentalStatiHeaders`. 

For adapters that enable support for this feature, Astro will not serve the CSP `<meta http-equiv="content-security-policy">` element in static pages.

Instead, Astro will serve the value of the header inside a map that can be retrieved from the hook `astro:build:generated`. Adapters can read this mapping and use their hosting headers capabilities to create a configuration file.

A new field called `_experimentalCspMapping` will contain a map of `Map<IntegrationResolvedRoute, string>` where the `string` type is the value of the header for the current route (e.g. `"script-src: 'self' sha256-abc123; style-src: 'self' sha256-abc123").

To enable support for this experimental Astro Adapter Feature, add it to your `supportedAstroFeatures` in your adapter config:

```diff
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
            _experimentalStaticHeaders: true
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
