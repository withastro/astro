---
'astro': minor
---

Adds a new experimental flag `queuedRendering` to enable a queue-based rendering engine 

The new engine is based on a two-pass process, where the first pass
traverses the tree of components, emits an ordered queue, and then the queue is rendered. 

The new engine does not use recursion, and comes with two customizable options.

Early benchmarks showed significant speed improvements and memory efficiency in big projects.

#### Queue-rendered based

The new engine can be enabled in your Astro config with `experimental.queuedRendering.enabled` set to `true`, and can be further customized with additional sub-features.

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

With the new engine enabled, you now have the option to have a pool of nodes that can be saved and reused across page rendering. Node pooling has no effect when rendering pages on demand (SSR) because these rendering requests don't share memory. However, it can be very useful for performance when building static pages.

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    queuedRendering: {
      enabled: true,
      poolSize: 2000 // store up to 2k nodes to be reused across renderers
    }
  }
});
```

#### Content caching

The new engine additionally unlocks a new `contentCache` option. This allows you to cache values of nodes during the rendering phase. This is currently a boolean feature with no further customization (e.g. size of cache) that uses sensible defaults for most large content collections:

When disabled, the pool engine won't cache strings, but only types.

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    queuedRendering: {
      enabled: true,
      contentCache: true // enable re-use of node values
    }
  }
});
```

For more information on enabling and using this feature in your project, see the [experimental queued rendering docs](https://v6.docs.astro.build/en/reference/experimental-flags/queued-rendering/) for more details.
