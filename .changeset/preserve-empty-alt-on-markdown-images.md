---
"@astrojs/markdown-remark": patch
---

Preserves an empty `alt` attribute on markdown images written without alt text (e.g. `![](./img.png)`). Previously the resulting `<img>` had no `alt` attribute at all, which is invalid for accessibility. Decorative markdown images now correctly emit `alt`.
