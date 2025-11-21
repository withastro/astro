---
'astro': minor
---

Adds the ability to configure the behavior of conflicting prerendered routes

By default, Astro warns you during the build about any conflicts between multiple dynamic routes that can result in the same output path. For example `/blog/[slug]` and `/blog/[...all]` both could try to prerender the `/blog/post-1` path. In such cases, Astro renders only the [highest priority route](https://docs.astro.build/en/guides/routing/#route-priority-order) for the conflicting path. This allows your site to build successfully, although you may discover that some pages are rendered by unexpected routes.

With the new `prerenderConflictBehavior` configuration option, you can now configure this further:

- `prerenderConflictBehavior: 'error'` fails the build
- `prerenderConflictBehavior: 'warning'` (default) logs a warning and the highest-priority route wins
- `prerenderConflictBehavior: 'ignore'` silently picks the highest-priority route when conflicts occur

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
+    prerenderConflictBehavior: 'error',
});
```
