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

See the [View Transitions guide](https://docs.astro.build/en/guides/view-transitions/) to learn about how to use the API.
