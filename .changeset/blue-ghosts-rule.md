---
"@astrojs/db": patch
---

Update the table indexes configuration to allow generated index names. The `indexes` object syntax is now deprecated in favor of an array.

## Migration

You can update your `indexes` configuration object to an array like so:

```diff
import { defineDb, defineTable, column } from 'astro:db';

const Comment = defineTable({
  columns: {
    postId: column.number(),
    author: column.text(),
    body: column.text(),
  },
- indexes: {
-   postIdIdx: { on: 'postId' },
-   authorPostIdIdx: { on: ['author, postId'], unique: true },
- },
+ indexes: [
+   { on: 'postId' /* 'name' is optional */ },
+   { on: ['author, postId'], unique: true },
+ ]
})
```

This example will generate indexes with the names `Comment_postId_idx` and `Comment_author_postId_idx`, respectively. You can specify a name manually by adding the `name` attribute to a given object. This name will be **global,** so ensure index names do not conflict between tables.
