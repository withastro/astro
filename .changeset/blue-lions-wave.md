---
'astro': major
---

Removes the deprecated `getStaticPaths()` caching behavior.

### Breaking Change

The automatic caching of `getStaticPaths()` results has been removed. If you need caching, implement it manually using your preferred caching solution.

### Migration

```diff
export async function getStaticPaths() {
-  // Results were automatically cached
+  // Implement your own caching if needed
   return posts.map(post => ({
     params: { slug: post.slug }
   }));
}
```
