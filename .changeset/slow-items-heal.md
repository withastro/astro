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

To make sure VSCode picks up the schema file, you have multiple option. You can either reference the file in every file of your content collection:
```diff
{
+  "$schema": "../../../.astro/collections/test.schema.json",
  "test": "test"
}
```

Or you can set your VSCode settings to match them, read more in the [VSCode docs](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings):

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
