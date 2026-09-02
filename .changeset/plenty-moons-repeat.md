---
'astro': minor
---

Adds `logger` to the context object passed to cache providers

Custom cache providers now receive Astro's runtime logger on the context passed to `onRequest()`. Messages logged with it are routed through the destination configured in `logger` and respect your log level, instead of being written straight to the console:

```ts
import type { CacheProvider } from 'astro';

const provider: CacheProvider = {
  name: 'my-cache',
  async onRequest({ request, url, logger }, next) {
    logger.warn(`Skipping cache for ${url.pathname} because the response sets a cookie.`);
    return next();
  },
  // ...
};
```

Astro's built-in `memoryCache()` provider now uses this logger for the warnings it emits when it skips caching a response that sets cookies, and when a background revalidation fails.
