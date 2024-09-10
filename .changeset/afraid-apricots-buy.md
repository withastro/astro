---
'astro': minor
---

Adapters can now specify the build output type they're intended for using the `adapterFeatures.buildOutput` property. This property can be used to always generate a server output, even if the project doesn't have any server-rendered pages.

```ts
{
  'astro:config:done': ({ setAdapter, config }) => {
    setAdapter({
      name: 'my-adapter',
      adapterFeatures: {
        buildOutput: 'server',
      },
    });
  },
}
```

If your adapter specifies `buildOutput: 'static'`, and the user's project contains server-rendered pages, Astro will warn in development and error at build time. Note that a hybrid output, containing both static and server-rendered pages, is considered to be a `server` output, as a server is required to serve the server-rendered pages.
