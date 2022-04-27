---
'astro': patch
'@astrojs/vercel': patch
'astro-scripts': patch
---

Fix `serialize-javascript` in hydrate runtime script from crashing the repl

Fix an issue with the hydrate runtime script, where the `serialize-javascript` package causes errors on the web, due to the `random-bytes` package `serialize-javascript` depends on. This issue is due to the fact that you need to use the built-in `crypto` module on nodejs, but on the web you use the `crypto` global. This fix should make it possible to separate `astro/runtime` into a separate `@astrojs/runtime` package, that the repl can use.
