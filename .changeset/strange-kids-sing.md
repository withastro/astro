---
'astro': minor
---

[BREAKING CHANGE] change Astro.fetchContent() to a runtime API. This makes two breaking changes to the existing Astro.fetchContent() API:

1. The method is now async. Previously, it was synchronous.
2. The method now takes in an `import.meta.glob()` argument. Previous, it took a string.

Example change to make to your code:

```diff
- let allPosts = Astro.fetchContent('../pages/posts/*.md');
+ let allPosts = await Astro.fetchContent(import.meta.glob('../pages/posts/*.md'));
```

An error will throw if you use the deprecated syntax.