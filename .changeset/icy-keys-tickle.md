---
'astro': minor
'@astrojs/markdown-remark': patch
---

Adds support for TOML files to Astro's built-in `glob()` and `file()` content loaders.

In Astro 5.2, Astro added support for using TOML frontmatter in Markdown files instead of YAML. However, if you wanted to use TOML files as local content collection entries themselves, you needed to write your own loader.

Astro 5.12 now directly supports loading data from TOML files in content collections in both the `glob()` and the `file()` loaders.

If you had added your own TOML content parser for the `file()` loader,  you can now remove it as this functionality is now included:

```diff
// src/content.config.ts
import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
- import { parse as parseToml } from "toml";
const dogs = defineCollection({
-  loader: file("src/data/dogs.toml", { parser: (text) => parseToml(text) }),
+ loader: file("src/data/dogs.toml")
  schema: /* ... */
})
```

Note that TOML does not support top level arrays. Instead, the `file()` loader considers each top level table to be an independent entry. The table header is populated in the `id` field of the entry object. 

See Astro's [content collections guide](https://docs.astro.build/en/guides/content-collections/#built-in-loaders) for more information on using the built-in content loaders.