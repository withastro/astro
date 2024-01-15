---
"astro": minor
---

Adds an experimental flag `clientPrerender` to pre-render your prefetched pages on the client with the [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API).

```js
// astro.config.mjs
{
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    clientPrerender: true,
  },
}
```

Enabling this feature overrides the default `prefetch` behavior globally to prerender links on the client according to your `prefetch` configuration. Instead of appending a `<link>` tag to the head of the document or fetching the page with JavaScript, a `<script>` tag will be appended with the corresponding speculation rules.

Client side prerendering requires browser support. If the Speculation Rules API is not supported, `prefetch` will fallback to the supported strategy.

See the [Prefetch Guide](https://docs.astro.build/en/guides/prefetch/) for more `prefetch` options and usage.