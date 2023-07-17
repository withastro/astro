---
'astro': minor
---

Redirects configuration

This change moves the `redirects` configuration out of experimental. If you were previously using experimental redirects, remove the following experimental flag:

```js
experimental: {
  redirects: true,
}
