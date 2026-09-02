---
'astro': minor
---

Infers collection types directly from your content config, and adds the `DataMap` interface

`astro sync` used to write out the type of every collection's `data` into the generated `astro:content` types. Those types are now inferred from your content config itself, so entry types stay accurate as you edit your schemas and the generated file shrinks to the two lines that point `astro:content` at your config.

This also means a collection's `data` is typed from any [Standard Schema](https://standardschema.dev) validator, not just Zod, and a collection with no schema is typed as `any` as before.

Alongside this, `DataMap` replaces `DataEntryMap` as the interface to augment when you type collections by hand. It maps a collection name to the type of its entry `data`, rather than to a record of its entries:

```ts
declare module 'astro:content' {
  interface DataMap {
    blog: { title: string; draft: boolean };
  }
}
```

`DataEntryMap`, `InferEntrySchema`, `InferLoaderSchema`, `ContentCollectionKey`, and `DataCollectionKey` are still exported but are deprecated and will be removed in Astro 8. Use `DataMap`, `CollectionEntry<C>['data']`, and `CollectionKey` instead.
