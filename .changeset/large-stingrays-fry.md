---
'astro': minor
---

Add an experimental Dev Overlay. This overlay allows you to inspect your page islands, see helpful audits on performance and accessibility, and more.


You can enable access to the dev overlay and its API by adding the following flag to your Astro config:

```ts
// astro.config.mjs
export default {
  experimental: {
    devOverlay: true
  }
};
```

Read the [Dev Overlay Plugin API documentation](https://docs.astro.build/en/reference/dev-overlay-plugin-reference/) for information about building your own plugins to integrate with Astro's dev overlay.
