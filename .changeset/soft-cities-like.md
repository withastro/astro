---
'astro': minor
---

Adds `reference(collection, id)` for content collection schemas, and deprecates `reference(collection)`

`reference()` used to return a Zod schema, which meant it only worked with Zod and could not be validated further. It now takes the entry id as a second argument and returns the reference itself, so you can call it from inside a schema transform with any validator:

```diff
// src/content.config.ts
schema: z.object({
- author: reference('authors'),
+ author: z.string().transform((id) => reference('authors', id)),
})
```

The single-argument form still works but is deprecated and will be removed in Astro 8.
