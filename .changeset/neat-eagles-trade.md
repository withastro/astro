---
'astro': major
---

Move getEntry to getEntryBySlug

This change moves `getEntry` to `getEntryBySlug` and accepts a slug rather than an id.

In order to improve support in `[id].astro` routes, particularly in SSR where you do not know what the id of a collection is. Using `getEntryBySlug` instead allows you to map the `[id]` param in your route to the entry. You can use it like this:

```astro
---
import { getEntryBySlug } from 'astro:content';

const entry = await getEntryBySlug('docs', Astro.params.id);

if(!entry) {
  return new Response(null, {
    status: 404
  });
}
---
<!-- You have an entry! Use it! -->
```
