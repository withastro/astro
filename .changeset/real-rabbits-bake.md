---
"@astrojs/markdown-remark": major
---

This changes the `markdown-remark` package to lazily load shiki languages by
default (only preloading `plaintext`). Additionally, highlighting is now an
async task due to this.
