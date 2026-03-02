---
'@astrojs/node': major
---

Removes the `experimentalErrorPageHost` option

This option allowed fetching a prerendered error page from a different host than the server is currently running on.

However, there can be security implications with prefetching from other hosts, and often more customization was required to do this safely. This has now been removed as a built-in option so that you can implement your own secure solution as needed and appropriate for your project via middleware.

#### What should I do?

If you were previously using this feature, you must remove the option from your adapter configuration as it no longer exists:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  adapter: node({
    mode: 'standalone',
-    experimentalErrorPageHost: 'http://localhost:4321'
  })
})
```

You can replicate the previous behavior by checking the response status in a middleware and fetching the prerendered page yourself:

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (ctx, next) => {
	const response = await next()
	if (response.status === 404 || response.status === 500) {
		return fetch(`http://localhost:4321/${response.status}.html`);
	}
	return response
})
```
