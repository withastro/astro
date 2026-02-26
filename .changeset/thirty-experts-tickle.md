---
'@astrojs/node': major
---

Removes the `experimentalErrorPageHost` option

This option allowed fetching a prerendered error page from a different host than the server is currently running on.

However, there can be security implications with prefetching from other hosts, and often more customization was required to do this safely. This has now been removed as a built-in option so that you can implement your own secure solution as needed and appropriate for your project via middleware.

#### What should I do?

If you were previously using this feature, you must remove the option from your adapter configuration as it no longer exists. You can replicate the previous behavior by running with `mode: 'middleware'` and intercepting responses:

```diff
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  adapter: node({
    mode: 'standalone',
-    experimentalErrorPageHost: 'http://localhost:4321'
  })
})
```
