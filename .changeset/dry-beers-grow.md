---
'astro': minor
---

Redirects configuration

This change moves the `redirects` configuration out of experimental, meaning if you are currently using the:

```js
experimental: {
  redirects: true,
}
```

You can simply remove this flag. If you have been waiting on using redirects before it stabilized, how you can do so. Checkout [the docs](https://docs.astro.build/en/core-concepts/routing/#redirects) to learn how to use the feature.
