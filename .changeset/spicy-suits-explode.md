---
"astro": minor
---

The Astro Actions API introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

Astro Actions allow you to define and call backend functions with type-safety. Actions perform data fetching, JSON parsing, and input validation for you. This can greatly reduce the amount of boilerplate needed compared to using an API endpoint.

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    actions: true,
-  }
})
```

If you have been waiting for stabilization before using Actions, you can now do so.

See [the Actions guide](https://docs.astro.build/en/guides/actions/) to learn more.
