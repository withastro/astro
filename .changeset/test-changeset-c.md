---
'astro': major
---

Removes support for the deprecated `Astro.glob()` API.

#### Migration Guide

Update your code to use `import.meta.glob()` instead:

```diff
- const posts = await Astro.glob('./posts/*.md');
+ const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
```
