---
'astro': major
---

This import alias is no longer included by default with astro:assets. If you were using this alias with experimental assets, you must convert them to relative file paths, or create your own [import aliases](https://docs.astro.build/en/guides/aliases/).

```diff
---
// src/pages/posts/post-1.astro
- import rocket from '~/assets/rocket.png'
+ import rocket from '../../assets/rocket.png';
---
```
