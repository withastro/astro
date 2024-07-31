---
'astro': minor
---

The `experimental.contentCollectionJsonSchema` feature introduced behind a flag in [v4.5.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#450) is no longer experimental and is available for general use.

If you are working with collections of type `data`, Astro will now auto-generate JSON schema files for your editor to get IntelliSense and type-checking. A separate file will be created for each data collection in your project based on your collections defined in `src/content/config.ts` using a library called [`zod-to-json-schema`](https://github.com/StefanTerdell/zod-to-json-schema).

This feature requires you to manually set your schema's file path as the value for `$schema` in each data entry file of the collection:

```json title="src/content/authors/armand.json" ins={2}
{
  "$schema": "../../../.astro/collections/authors.schema.json",
  "name": "Armand",
  "skills": ["Astro", "Starlight"]
}
```

Alternatively, you can set this value in your editor settings. For example, to set this value in [VSCode's `json.schemas` setting](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings), provide the path of files to match and the location of your JSON schema:

```json
{
  "json.schemas": [
  {
    "fileMatch": [
      "/src/content/authors/**"
    ],
    "url": "./.astro/collections/authors.schema.json"
  }
  ]
}
```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    contentCollectionJsonSchema: true
-  }
})
```

If you have been waiting for stabilization before using JSON Schema generation for content collections, you can now do so.

Please see [the content collections guide](https://docs.astro.build/en/guides/content-collections/#enabling-json-schema-generation) for more about this feature.
