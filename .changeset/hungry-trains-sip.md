---
'astro': minor
---

Adds a new experimental configuration option `rawEnvValues` to allow you to opt out of Astro's automatic coercion of specific environment variable values to their respective types.

Currently, environment variables with the values of `"true"`, `"false"`, `"1"`, or `"0"` are converted to their respective types on the `import.meta.env` object. For example, `"true"` (string) becomes `true` (boolean). `"1"` (string) becomes `1` (number).

This default behavior is a holdover from when Astro supported dynamic prerender values in routes which was [removed in Astro v5](https://docs.astro.build/en/guides/upgrade-to/v5/#removed-support-for-dynamic-prerender-values-in-routes).

Coercion of these values can be unexpected since environment variables are generally expected to be strings. When this option is removed in a future version of Astro, these values will no longer be coerced.

**This options has no effect on [the `astro:env` module](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables). It only affects the `import.meta.env` object.

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    rawEnvValues: true
  }
})
```
