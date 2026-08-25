---
'@astrojs/mdx': major
---

Rendering `.mdx` files now requires `@astrojs/markdown-satteri` 0.4.0 or later, and `@astrojs/markdown-remark` 7.3.0 or later if you use `unified()`. If neither appears in your own `package.json`, there's nothing to do. If one does, update it — a `^0.3.x` or `^7.2.x` range won't move to these on its own.
