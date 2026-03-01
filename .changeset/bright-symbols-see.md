---
'astro': major
---

**BREAKING CHANGE to the v6 beta Adapter API only**: renames `entryType` to `entrypointResolution` and updates possible values

Astro 6 introduced a way to let adapters have more control over the entrypoint by passing `entryType: 'self'` to `setAdapter()`. However during beta development, the name was unclear and confusing.

`entryType` is now renamed to `entrypointResolution` and its possible values are updated:

- `legacy-dynamic` becomes `explicit`.
- `self` becomes `auto`.

If you are building an adapter with v6 beta and specifying `entryType`, update it:

```diff
setAdapter({
    // ...
-    entryType: 'legacy-dynamic'
+    entrypointResolution: 'explicit'
})

setAdapter({
    // ...
-    entryType: 'self'
+    entrypointResolution: 'auto'
})
```
