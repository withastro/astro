---
layout: ~/layouts/MainLayout.astro
title: Configuration Reference
---

To configure Astro, add an `astro.config.mjs` file in the root of your project. All settings are optional.

You can view the full configuration API (including information about default configuration) on [GitHub.](https://github.com/snowpackjs/astro/blob/latest/packages/astro/src/@types/config.ts)

```js
// Example: astro.config.mjs

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  // ...
});

```

## Snowpack Config

Astro is powered internally by Snowpack. You can configure Snowpack directly by creating a `snowpack.config.mjs` file. See [snowpack.dev](https://www.snowpack.dev/reference/configuration) for full documentation on this file.
