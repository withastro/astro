---
'astro': minor
---

Adds `reference(collection, id)` from `astro/content/fields` for content collection schemas and deprecates `reference(collection)` from `astro:content`

Call the helper from your validator's transform with a collection name and an entry ID. It returns a reference you can pass to `getEntry()`:

```diff
// src/content.config.ts
-import { reference } from 'astro:content';
+import { reference } from 'astro/content/fields';

schema: z.object({
- author: reference('authors'),
+ author: z.string().transform((id) => reference('authors', id)),
})
```

Pass a string or numeric ID, or an existing reference to the same collection. Numeric IDs become strings. An invalid lookup, including a reference to a different collection, throws `InvalidContentReferenceError` during sync.

The single-argument form still works but is deprecated and will be removed in Astro 8.
