---
'astro': minor
'@astrojs/cloudflare': minor
---

Adds `allowedHosts` to the `PreviewServerParams` interface, making the `server.allowedHosts` configuration available to adapter preview entrypoints.

Previously, `server.allowedHosts` was only applied to the static preview server and the dev server. When using `astro preview` with an adapter like `@astrojs/cloudflare`, requests with non-localhost `Host` headers were always blocked with a `403 Forbidden` response, regardless of your configuration.

You can now configure `server.allowedHosts` and it will be respected during `astro preview` with any adapter that supports it:

```js
// astro.config.mjs
export default defineConfig({
  server: {
    allowedHosts: ['staging.example.com'],
  },
});
```
