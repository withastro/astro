---
'@astrojs/node': minor
---

Adds graceful shutdown to the standalone Node server.

The standalone server now handles `SIGTERM` and `SIGINT` signals (e.g. when a host stops or restarts your deployment). It stops accepting new connections but gives active requests time to finish before closing, up to 10 seconds by default. By default the process then exits on its own once shutdown completes, so any other signal listeners your app registers still get a chance to run.

Use the new `shutdown` adapter option to customize this behavior. Set `shutdown.timeout` to `0` to force-close immediately, or to `Infinity` to wait indefinitely for requests to finish. Set `shutdown.exit` to `true` to force the process to exit even if open timers or connections remain.

The following example increases the timeout and forces the process to exit once shutdown completes:

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
    shutdown: {
      timeout: 30 * 1000,
      exit: true,
    },
  }),
});
```
