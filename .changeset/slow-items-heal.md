---
"astro": minor
---

Adds experimental JSON Schema support for content collections.

This feature will auto-generate a JSON Schema for content collections of `type: 'data'` which can be used as the `$schema` value for TypeScript-style autocompletion/hints in tools like VSCode.

To enable this feature, add the experimental flag:

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
+		contentCollectionJsonSchema: true
	}
});
```

This experimental implementation requires you to manually reference the schema in each data entry file of the collection:

```diff
// src/content/test/entry.json
{
+  "$schema": "../../../.astro/collections/test.schema.json",
  "test": "test"
}
```

Alternatively, you can set this in your [VSCode `json.schemas` settings](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings):

```diff
"json.schemas": [
  {
    "fileMatch": [
      "/src/content/test/**"
    ],
    "url": "../../../.astro/collections/test.schema.json"
  }
]
```

Note that this initial implementation uses a library with [known issues for advanced Zod schemas](https://github.com/StefanTerdell/zod-to-json-schema#known-issues), so you may wish to consult these limitations before enabling the experimental flag.
