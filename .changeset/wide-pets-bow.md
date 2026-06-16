---
'astro': minor
---

Adds the optional `digest` property to content collection entries.

Loaders can provide an opaque digest value that changes when an entry changes. This is now reflected in the `CollectionEntry` type returned by `getCollection()` and `getEntry()`, making it easier to detect content changes without re-hashing large entry bodies.

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');

for (const post of posts) {
	console.log(post.digest);
}
---
```

The property is optional because not every loader provides a digest.
