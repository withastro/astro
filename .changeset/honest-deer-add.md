---
'astro': major
---

Numbers are no longer allowed in `params` returned by `getStaticPaths()`.

Previously, `getStaticPaths()` could return `params` with number values. However, at runtime `Astro.params` values are always strings or undefined because they come from URL segments. This change removes that mismatch so the types reflect runtime behavior.

#### What should I do?

In the returned `params` object from `getStaticPaths()`, convert any numbers to strings (for example, `String(id)`).

```diff
---
// src/pages/post/[id]/[label].astro
export function getStaticPaths() {
    return [
        {
            params: {
-               id: 1,
+               id: "1",
                label: "foo",
            }
        },
        {
            params: {
-               id: 2,
+               id: "2",
                label: "bar",
            }
        },
    ]
}
---
