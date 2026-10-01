---
'astro': minor
---

Adds `reference(collection, id)` for content collection schemas, and deprecates `reference(collection)`

`reference()` used to return a Zod schema, which meant it only worked with Zod and its result could not be validated any further. It now takes the referenced entry as a second argument and returns the reference itself, so you can call it from inside a schema transform with any validator:

```diff
// src/content.config.ts
schema: z.object({
- author: reference('authors'),
+ author: z.string().transform((id) => reference('authors', id)),
})
```

That second argument accepts what the schema form accepted: an entry id, as a string or a number, or a reference object an earlier parse produced. Anything else now throws while your content is synced, instead of being reported as a validation issue on the field.

The single-argument form still works but is deprecated and will be removed in Astro 8.
