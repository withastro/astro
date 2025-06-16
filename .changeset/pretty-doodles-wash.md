---
'astro': minor
---

Adds experimental support for live content collections

Live content collections are a new type of [content collection](https://docs.astro.build/en/guides/content-collections/) that fetch their data at runtime rather than build time. This allows you to access frequently-updated data from CMSs, APIs, databases, or other sources using a unified API, without needing to rebuild your site when the data changes.

In Astro 5.0, the content layer API added support for adding diverse content sources to content collections. You can create loaders that fetch data from any source at build time, and then access it inside a page via `getEntry` and `getCollection`. The data is cached between builds, giving fast access and updates. 

However there is no method for updating the data store between builds, meaning any updates to the data need a full site deploy, even if the pages are rendered on-demand. This means that content collections are not suitable for pages that update frequently. Instead, today these pages tend to access the APIs directly in the frontmatter. This works, but leads to a lot of boilerplate, and means users don't benefit from the simple, unified API that content loaders offer. In most cases users tend to individually create loader libraries that they share between pages.

Live content collections solve this problem by allowing you to create loaders that fetch data at runtime, rather than build time. This means that the data is always up-to-date, without needing to rebuild the site. 

## How to use

To enable live collections add the `experimental.liveContentCollections` flag to your `astro.config.mjs` file:

```js title="astro.config.mjs"
{
  experimental: {
    liveContentCollections: true,
  },
}
```

Then create a new `src/live.config.ts` file (alongside your `src/content.config.ts` if you have one) to define your live collections with a [live loader](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/#creating-a-live-loader) and optionally a [schema](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/#using-zod-schemas) using the new `defineLiveCollection()` function from the `astro:content` module.

```ts title="src/live.config.ts"
import { defineLiveCollection } from 'astro:content';
import { storeLoader } from '@mystore/astro-loader';

const products = defineLiveCollection({
  type: 'live',
  loader: storeLoader({
    apiKey: process.env.STORE_API_KEY,
    endpoint: 'https://api.mystore.com/v1',
  }),
});

export const collections = { products };
```

You can then use the dedicated `getLiveCollection()` and `getLiveEntry()` functions to access your live data:

```astro
---
import { getLiveCollection, getLiveEntry, render } from 'astro:content';

// Get all products
const { entries: allProducts, error } = await getLiveCollection('products');
if (error) {
  // Handle error appropriately
  console.error(error.message);
}

// Get products with a filter (if supported by your loader)
const { entries: electronics } = await getLiveCollection('products', { category: 'electronics' });

// Get a single product by ID (string syntax)
const { entry: product, error: productError } = await getLiveEntry('products', Astro.params.id);
if (productError) {
  return Astro.redirect('/404');
}

// Get a single product with a custom query (if supported by your loader) using a filter object
const { entry: productBySlug } = await getLiveEntry('products', { slug: Astro.params.slug });

const { Content } = await render(product);

---

<h1>{product.title}</h1>
<Content />

```

See [the docs for the experimental live content collections feature](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/) for more details on how to use this feature, including how to create a live loader. Please give feedback on [the RFC PR](https://github.com/withastro/roadmap/pull/1164) if you have any suggestions or issues.
