---
'astro': minor
---


Dev Overlay (experimental)

Provides a new dev overlay for your browser preview that allows you to inspect your page islands, see helpful audits on performance and accessibility, and more. A Dev Overlay Plugin API is also included to allow you to add new features and third-party integrations to it.

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
