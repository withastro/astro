---
'astro': minor
'@astrojs/node': minor
---

Add support for passing in context from NodeJS adapter.

Add a new property `Astro.context` which can be accessed by components and a new `context` property on the argument passed into endpoints. This context is set by passing a context object into the handler for the SSR adapter, and is set to `null` during SSG.
