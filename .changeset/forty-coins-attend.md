---
"astro": minor
---

Implement RFC [#0017](https://github.com/withastro/rfcs/blob/main/proposals/0017-markdown-content-redesign.md)

- New Markdown API
- New `Astro.glob()` API
- **BREAKING CHANGE:** Removed `Astro.fetchContent()` (replaced by `Astro.glob()`)

```diff
// v0.25
- let allPosts = Astro.fetchContent('./posts/*.md');
// v0.26+
+ let allPosts = await Astro.glob('./posts/*.md');
```
