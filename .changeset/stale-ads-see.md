---
'astro': minor
---

Adds support for live content collections

Live content collections are a new type of [content collection](https://docs.astro.build/en/guides/content-collections/) that fetch their data at runtime rather than build time. This allows you to access frequently updated data from CMSs, APIs, databases, or other sources using a unified API, without needing to rebuild your site when the data changes.

#### Live collections vs build-time collections

In Astro 5.0, the content layer API added support for adding diverse content sources to content collections. You can create loaders that fetch data from any source at build time, and then access it inside a page via `getEntry()` and `getCollection()`. The data is cached between builds, giving fast access and updates. 

However, there was no method for updating the data store between builds, meaning any updates to the data needed a full site deploy, even if the pages are rendered on demand. This meant that content collections were not suitable for pages that update frequently. Instead, these pages tended to access the APIs directly in the frontmatter. This worked, but it led to a lot of boilerplate, and meant users didn't benefit from the simple, unified API that content loaders offer. In most cases, users tended to individually create loader libraries shared between pages.

Live content collections ([introduced experimentally in Astro 5.10](https://astro.build/blog/live-content-collections-deep-dive/)) solve this problem by allowing you to create loaders that fetch data at runtime, rather than build time. This means that the data is always up-to-date, without needing to rebuild the site. 

#### How to use

To use live collections, create a new `src/live.config.ts` file (alongside your `src/content.config.ts` if you have one) to define your live collections with a live content loader using the new `defineLiveCollection()` function from the `astro:content` module:

```ts title="src/live.config.ts"
import { defineLiveCollection } from 'astro:content';
import { storeLoader } from '@mystore/astro-loader';

const products = defineLiveCollection({
  loader: storeLoader({
    apiKey: process.env.STORE_API_KEY,
    endpoint: 'https://api.mystore.com/v1',
  }),
});

export const collections = { products };
```

You can then use the `getLiveCollection()` and `getLiveEntry()` functions to access your live data, along with error handling (since anything can happen when requesting live data!):

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
<h1>{product.data.title}</h1>
<Content />
```

#### Upgrading from experimental live collections

If you were using the experimental feature, you must remove the `experimental.liveContentCollections` flag from your `astro.config.*` file:

```diff
 export default defineConfig({
   // ...
-  experimental: {
-    liveContentCollections: true,
-  },
 });
```

No other changes to your project code are required as long as you have been keeping up with Astro 5.x patch releases, which contained breaking changes to this experimental feature. If you experience problems with your live collections after upgrading to Astro v6 and removing this flag, please review the [Astro CHANGELOG from 5.10.2](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#5102) onwards for any potential updates you might have missed, or follow the [current v6 documentation for live collections](https://docs.astro.build/en/guides/content-collections/).
