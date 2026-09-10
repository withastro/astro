---
'astro': minor
---

Adds `notFound()` and `NotFoundError` to `astro:navigation` to programmatically trigger 404 responses

This allows `.astro` page components, API endpoints, middleware, and external data-fetching helpers to trigger a 404 response natively by calling `notFound()`, gracefully rendering `404.astro` (with dynamic error props) while suppressing server crash logs.

Because `notFound()` can be called inside helper functions and returns `never`, you can encapsulate 404 checks in data loaders without repeating boilerplate in every `.astro` frontmatter:

```ts
// src/lib/blog.ts
import { notFound } from 'astro:navigation';

export async function loadBlog(id: string) {
  const blog = await fetchBlog(id);
  if (!blog) {
    notFound('Blog post not found');
  }
  return blog;
}
```

```astro
---
// src/pages/blog/[id].astro
import { loadBlog } from '../../lib/blog';

// No need for repetitive `if (!blog) return Astro.redirect('/404')` checks
const blog = await loadBlog(Astro.params.id);
---
<h1>{blog.title}</h1>
```
