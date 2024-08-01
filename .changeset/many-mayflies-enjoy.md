---
'astro': patch
---

Removes async local storage dependency from Astro Actions. This allows Actions to run in Cloudflare and Stackblitz without opt-in flags or other configuration.

This also introduces a new convention for calling actions from server code. Instead of calling actions directly, you must wrap function calls with the new `Astro.callAction()` utility.

> `callAction()` is meant to _trigger_ an action from server code. `getActionResult()` usage with form submissions remains unchanged.

```astro
---
import { actions } from 'astro:actions';

const result = await Astro.callAction(actions.searchPosts, {
  searchTerm: Astro.url.searchParams.get('search'),
});
---

{result.data && (
  {/* render the results */}
)}
```

## Migration

If you call actions directly from server code, update function calls to use the `Astro.callAction()` wrapper for pages and `context.callAction()` for endpoints:

```diff
---
import { actions } from 'astro:actions';

- const result = await actions.searchPosts({ searchTerm: 'test' });
+ const result = await Astro.callAction(actions.searchPosts, { searchTerm: 'test' });
---
```

If you deploy with Cloudflare and added [the `nodejs_compat` or `nodejs_als` flags](https://developers.cloudflare.com/workers/runtime-apis/nodejs) for Actions, we recommend removing these:

```diff
compatibility_flags = [
- "nodejs_compat",
- "nodejs_als"
]
```

You can also remove `node:async_hooks` from the `vite.ssr.external` option in your `astro.config` file:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
- vite: {
-   ssr: {
-     external: ["node:async_hooks"]
-   }
- }
})
```
