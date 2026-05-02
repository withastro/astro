---
'@astrojs/cloudflare': patch
---

Fixes `ReferenceError: module is not defined` on every request when running `astro dev` with the Cloudflare adapter. The error was triggered whenever a page's dependency graph pulled in the CJS `debug` package (transitively via `micromark`, `stylus`, and many other common npm packages). The adapter now aliases `debug` to an internal ESM shim backed by `obug` in the `ssr`, `astro`, and `prerender` Vite environments, so the workerd runner used by `@cloudflare/vite-plugin` no longer hits the missing `module` global.
