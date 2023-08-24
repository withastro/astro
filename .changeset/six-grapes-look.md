---
'astro': major
---

The value of `import.meta.env.BASE_URL`, which is derived from the `base` option, will no longer have a trailing slash added by default or when `trailingSlash: "ignore"` is set. The existing behavior of `base` in combination with `trailingSlash: "always"` or `trailingSlash: "never"` is unchanged.

If your `base` already has a trailing slash, no change is needed.

If your `base` does not have a trailing slash, add one to preserve the previous behaviour:

```diff
// astro.config.mjs
- base: 'my-base',
+ base: 'my-base/',
```
