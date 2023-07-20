---
'astro': minor
---

Redirects configuration

This change moves the `redirects` configuration out of experimental. If you were previously using experimental redirects, remove the following experimental flag:

```js
experimental: {
  redirects: true,
}
```

If you have been waiting for stabilization before using redirects, now you can do so. Check out [the docs on redirects](https://docs.astro.build/en/core-concepts/routing/#redirects) to learn how to use this built-in feature.
