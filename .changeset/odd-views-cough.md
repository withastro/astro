---
'astro': minor
---

Adds experimental support for defining live collections in `src/content.config.ts`, next to your build-time collections

Live collections currently need their own `src/live.config.ts` file, because it is bundled with your server while `src/content.config.ts` is only evaluated when content is synced. With the new `experimental.liveContentEntrypoints` flag, you can declare every collection in `src/content.config.ts`, and point each live collection to an entrypoint: a module that default-exports the collection, defined with `defineLiveCollection()`.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    liveContentEntrypoints: true,
  },
});
```

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog' }),
});

const products = defineCollection({
  type: 'live',
  entrypoint: './src/live/products.ts',
});

export const collections = { blog, products };
```

```ts
// src/live/products.ts
import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { productsLoader } from './loaders/products';

export default defineLiveCollection({
  loader: productsLoader(),
  schema: z.object({ title: z.string(), price: z.number() }),
});
```

Entrypoints are resolved from the root of your project. Only the entrypoints and their imports are bundled with your server, so build-time loaders and their dependencies stay out of it. `getLiveCollection()` and `getLiveEntry()` work the same, and live collections defined in `src/live.config.ts` keep working alongside them.
