---
'astro': minor
---

Adds `streaming` option to the `createApp()` function in the Adapter API, mirroring the same functionality available when creating a new `App` instance

An adapter's `createApp()` function now accepts `streaming` (defaults to `true`) as an option. HTML streaming breaks a document into chunks to send over the network and render on the page in order. This normally results in visitors seeing your HTML as fast as possible but factors such as network conditions and waiting for data fetches can block page rendering.

HTML streaming helps with performance and generally provides a better visitor experience. In most cases, disabling streaming is not recommended.

However, when you need to disable HTML streaming (e.g. your host only supports non-streamed HTML caching at the CDN level), you can opt out of the default behavior by passing `streaming: false` to `createApp()`:

```ts
import { createApp } from 'astro/app/entrypoint'

const app = createApp({ streaming: false })
```

See more about [the `createApp()` function](https://v6.docs.astro.build/en/reference/adapter-reference/#createapp) in the Adapter API reference.
