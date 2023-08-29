---
'astro': minor
---

View Transitions unflagged

View Transition support in Astro is now unflagged. For those who have used the experimental feature you can remove the flag in your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    viewTransitions: true,
-  }
})
```

After removing this flag, please also consult the specific [upgrade to v3.0 advice](https://docs.astro.build/en/guides/view-transitions/#upgrade-to-v30-from-v2x) as some API features have changed and you may have breaking changes with your existing view transitions.

See the [View Transitions guide](https://docs.astro.build/en/guides/view-transitions/) to learn how to use the API.
