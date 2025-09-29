---
'astro': major
---

Deprecates `Astro` in `getStaticPaths()`

In Astro 5.x, it was possible to access an `Astro` object inside `getStaticPaths()`. However, despite being typed the same as the `Astro` object accessible in the frontmatter, this object only had `site` and `generator` properties. This could lead to confusion about which `Astro` object properties were available inside `getStaticPaths()`.

Astro 6.0 deprecates this object for `getStaticPaths()` to avoid confusion and improves error handling when attempting to access `Astro` values that are unavailable. Using `Astro.site` or `Astro.generator` within `getStaticPaths()` will now log a deprecation warning, and accessing any other property will throw a specific error with a helpful message. In a future major version, this object will be removed entirely, and accessing `Astro.site` or `Astro.generator` will also throw an error.

#### What should I do?

Update your `getStaticPaths()` function if you were attempting to access any `Astro` properties inside its scope. Remove `Astro.generator` entirely, and replace all occurrences of `Astro.site()` with `import.meta.env.SITE`:

```diff
---
// src/pages/blog/[slug].astro
import { getPages } from "../../../utils/data";

export async function getStaticPaths() {
-    console.log(Astro.generator);
-    return getPages(Astro.site);
+    return getPages(import.meta.env.SITE);
}
---
```

