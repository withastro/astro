---
'@astrojs/solid-js': minor
---

Adds support for Solid server functions (experimental)

Enable with the `serverFunctions` option (requires an adapter — server functions need a server at runtime):

```js
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

export default defineConfig({
  integrations: [solid({ serverFunctions: true })],
});
```

`"use server"` functions imported by Solid islands are compiled to typed RPC calls. The integration injects the transport endpoint (default `/_server`) as an Astro route, so server-function requests flow through Astro's middleware pipeline — the same auth guards and `locals` decoration pages get — in dev and production alike. Inside a server function, Solid's `getRequestEvent()` exposes the request, Astro's `locals`, and the full Astro API context as `nativeEvent`.

Island SSR now also runs inside a Solid request-event scope, so `getRequestEvent()` and direct in-process server function calls work during server rendering.

Pass an options object instead of `true` to customize (endpoint path, argument codec, etc.) — it is forwarded to `@solidjs/vite-plugin`.
