---
'astro': major
---

Remove `data` and `body` from the custom collection `slug()` mapper.

### Migration

If you computed slugs based on frontmatter data, we suggest reading this property separately where your content is used:

```ts

export function getStaticPaths() {
  const posts = await getCollection('blog');
  posts.map(post => ({
    params: { slug: post.data.slug ?? post.slug },
  }))
}
```
