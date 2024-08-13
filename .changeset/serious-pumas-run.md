---
'astro': minor
---

Adds support for Intellisense features (e.g. code completion, quick hints) for your content collection entries in compatible editors under the `experimental.contentIntellisense` flag.

```js
import { defineConfig } from 'astro';

export default defineConfig({
	experimental: {
		contentIntellisense: true
	}
})
```

When enabled, this feature will generate and add JSON schemas to the `.astro` directory in your project. These files can be used by the Astro language server to provide Intellisense inside content files (`.md`, `.mdx`, `.mdoc`).

Note that at this time, this also require enabling the `astro.content-intellisense` option in your editor, or passing the `contentIntellisense: true` initialization parameter to the Astro language server for editors using it directly.

See the [experimental content Intellisense docs](https://docs.astro.build/en/reference/configuration-reference/#experimentalcontentintellisense) for more information updates as this feature develops.
