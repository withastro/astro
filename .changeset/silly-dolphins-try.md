---
'@astrojs/vercel': major
---

Vercel adapter now defaults to a function per route

With this change, in `@astrojs/vercel/serverless`, now each route is split into its own function. By doing this the size of each function is reduced and startup time is faster.

You can disable this option, which will cause the code to be bundled into a single function, by setting `functionPerRoute` to false.
