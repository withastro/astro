---
'astro': minor
---

Infers collection types from your content config, and adds the `DataMap` and `LiveDataMap` interfaces

`astro sync` used to write out the type of every collection's `data` into the generated `astro:content` types. Those types are now inferred from your content config itself, so entry types stay accurate as you edit your schemas.

This also means a collection's `data` is typed from any [Standard Schema](https://standardschema.dev) validator, not just Zod. A collection with no schema is typed as `any`, as before.

#### Typing collections by hand

`DataMap` replaces `DataEntryMap` as the interface to augment when you type a collection yourself, or when an integration ships one Astro cannot infer. It maps a collection name to the type of its entry `data`, rather than to a record of its entries:

```ts
declare module 'astro:content' {
  interface DataMap {
    blog: { title: string; draft: boolean };
  }
}
```

`LiveDataMap` is the same for live collections, which are inferred from your live config. A live collection is typed by more than its data, so an entry maps a collection name to the set of types its loader works with, and only has to declare the ones you use:

- `data` is what the loader returns
- `entryFilter` and `collectionFilter` are what `getLiveEntry()` and `getLiveCollection()` accept
- `error` is what the loader can fail with

```ts
declare module 'astro:content' {
  interface LiveDataMap {
    products: { data: Product; entryFilter: { sku: string } };
  }
}
```

#### Deprecations

`DataEntryMap`, `InferEntrySchema`, `InferLoaderSchema`, `ContentCollectionKey`, and `DataCollectionKey` are still exported but are deprecated and will be removed in Astro 8. Use `DataMap`, `CollectionEntry<C>['data']`, and `CollectionKey` instead.
