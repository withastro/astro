---
'astro': major
---

Removes `Astro.glob()`

In Astro 5.0, `Astro.glob()` was deprecated in favor of using `getCollection()` to query your collections, and `import.meta.glob()` to query other source files in your project.

Astro 6.0 removes `Astro.glob()` entirely. Update to `import.meta.glob()` to keep your current behavior.

#### What should I do?

Replace all use of `Astro.glob()` with `import.meta.glob()`. Note that `import.meta.glob()` no longer returns a `Promise`, so you may have to update your code accordingly. You should not require any updates to your glob patterns.

```astro
---
// src/pages/blog.astro
-const posts = await Astro.glob('./posts/*.md');
+const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
---
{posts.map((post) => <li><a href={post.url}>{post.frontmatter.title}</a></li>)}
```

Where appropriate, consider using content collections to organize your content, which has its own newer, more performant querying functions.
