---
'astro': minor
---

Adds `DataMap` and `LiveDataMap` interfaces that infer collection types from your content config

For build-time collections, `entry.data` uses the output type of the collection schema or, if you omit it, the type provided by the loader's schema. Without either, `entry.data` is `any`. For live collections, a schema overrides the loader's data type and preserves its filter and error types.

#### Typing collections by hand

`DataMap` replaces `DataEntryMap` as the interface to augment when you type a collection yourself, or when an integration ships one Astro cannot infer. It maps a collection name to the type of its entry `data`, rather than to a record of its entries:

```ts
declare module 'astro:content' {
  interface DataMap {
    blog: { title: string; draft: boolean };
  }
}
```

Augment `LiveDataMap` for a live collection. Declare only the properties you need:

- `data` is what the loader returns
- `entryFilter` and `collectionFilter` are what `getLiveEntry()` and `getLiveCollection()` accept
- `error` is what the loader can fail with

```ts
declare module 'astro:content' {
  interface LiveDataMap {
    products: { data: { name: string; price: number }; entryFilter: { sku: string } };
  }
}
```

#### Deprecations

The following types are deprecated and will be removed in Astro 8:

- To declare collection data, replace `DataEntryMap` with `DataMap`.
- To read the data type of collection `C`, replace `InferEntrySchema<C>` or `InferLoaderSchema<C>` with `CollectionEntry<C>['data']`.
- To refer to a collection name, replace `ContentCollectionKey` or `DataCollectionKey` with `CollectionKey`.
