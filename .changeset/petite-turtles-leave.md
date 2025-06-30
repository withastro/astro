---
'astro': patch
---

Removes the requirement to set `type: 'live'` when defining experimental live content collections

Previously, live collections required a `type` and `loader` configured. Now, Astro can determine that your collection is a `live` collection without defining it explicitly.

This means it is now safe to remove `type: 'live'` from your collections defined in `src/live.config.ts`:

```diff
import { defineLiveCollection } from 'astro:content';
import { storeLoader } from '@mystore/astro-loader';

const products = defineLiveCollection({
-  type: 'live',
  loader: storeLoader({
    apiKey: process.env.STORE_API_KEY,
    endpoint: 'https://api.mystore.com/v1',
  }),
});

export const collections = { products };
```

This is not a breaking change: your existing live collections will continue to work even if you still include `type: 'live'`. However, we suggest removing this line at your earliest convenience for future compatibility when the feature becomes stable and this config option may be removed entirely.
