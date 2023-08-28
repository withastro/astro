---
'@astrojs/vercel': major
---

Vercel adapter now defaults to `functionPerRoute`.

With this change, `@astrojs/vercel/serverless` now splits each route into its own function. By doing this, the size of each function is reduced and startup time is faster.

You can disable this option, which will cause the code to be bundled into a single function, by setting `functionPerRoute` to `false`.
