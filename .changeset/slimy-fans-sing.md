---
'astro': minor
---

Passes collection name to live content loaders

Live content collection loaders now receive the collection name as part of their parameters. This is helpful for loaders that manage multiple collections or need to differentiate behavior based on the collection being accessed.

```ts
export function storeLoader({
  field,
  key,
}) {
  return {
    name: "store-loader",
    loadCollection: async ({ filter, collection }) => {
      // ...
    },
    loadEntry: async ({ filter, collection }) => {
      // ...
    },
  };
}
```
