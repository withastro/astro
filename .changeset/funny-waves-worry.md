---
'astro': minor
'@astrojs/netlify': minor
---

Introduces the **experimental** Prerender API.

> **Note**
> This API is not yet stable and is subject to possible breaking changes!

- Deploy an Astro server without sacrificing the speed or cacheability of static HTML.
- The Prerender API allows you to statically prerender specific `pages/` at build time.

**Usage**

- First, run `astro build --experimental-prerender` or enable `experimental: { prerender: true }` in your `astro.config.mjs` file.
- Then, include `export const prerender = true` in any file in the `pages/` directory that you wish to prerender.
