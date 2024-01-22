---
"@astrojs/markdown-remark": patch
---

Initializes internal `cwdUrlStr` variable lazily for performance, and workaround Rollup side-effect detection bug when building for non-Node runtimes
