---
'astro': patch
---

Adds a new Astro Adapter Feature called `experimentalStaticHeaders` to allow your adapter to receive the `Headers` for rendered static pages.

Adapters that enable support for this feature can access header values directly, affecting their handling of some Astro features such as Content Security Policy (CSP). For example, Astro will no longer serve the CSP `<meta http-equiv="content-security-policy">` element in static pages to adapters with this support.

Astro will serve the value of the header inside a map that can be retrieved from the hook `astro:build:generated`. Adapters can read this mapping and use their hosting headers capabilities to create a configuration file.

A new field called `experimentalRouteToHeaders` will contain a map of `Map<IntegrationResolvedRoute, Headers>` where the `Headers` type contains the headers emitted by the rendered static route. 

To enable support for this experimental Astro Adapter Feature, add it to your `adapterFeatures` in your adapter config:

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
            experimentalStaticHeaders: true
          }
        });
      },
    },
  };
}
```

See the [Adapter API docs](https://docs.astro.build/en/reference/adapter-reference/#adapter-features) for more information about providing adapter features.
