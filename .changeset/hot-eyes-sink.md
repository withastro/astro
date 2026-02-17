---
'astro': minor
---

Adds a new experimental rendering engine in Astro. The new engine is based on a two-pass process, where the first pass
traverses the tree of components, emits an ordered queue, and then the queue is rendered. 

Early benchmarks showed significant speed improvements and memory efficiency in big projects.

#### Queue-rendered based

The new engine doesn't use recursion, and it comes with three different sub-features. The first feature is the queue, which can be enabled using the experimental flag:

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    queuedRendering: {
      enabled: true
    }
  }
})
```

#### Pooling

The second sub-feature of the new engine is the ability to have a pool of nodes, that can be saved and re-used across page rendering. Node pooling is useless in SSR, because rendering requests don't share memory, however it can be very useful when building static pages.

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    queuedRendering: {
      enabled: true,
      poolSize: 2000 // store up to 2k nodes to be re-used across renderers
    }
  }
})
```

#### Content caching

The third sub-feature is content caching. It allows to cache **values** of nodes during the rendering phase. Among the new tools, this seemed to be the least useful, so for now it's not possible to control its size:

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    queuedRendering: {
      enabled: true,
      contentCache: true // enable re-use of node values
    }
  }
})
```
