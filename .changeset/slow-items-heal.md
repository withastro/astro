---
"astro": minor
---

Adds experimental JSON Schema support for content collections of with `type: 'data'`.

To enable this feature, add the experimental flag:

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
+		contentCollectionJsonSchema: true
	}
});
```

To be able to use the schemas, you need to adapt your zod definition and reference it inside the json manually:

```diff
const test = defineCollection({
	type: 'data',
	schema: z.object({
+		"$schema": z.string().optional(),
    test: z.string()
	}),
});
```

```diff
{
+  "$schema": "../../../.astro/schemas/collections/test.json",
  "test": "test"
}
```
