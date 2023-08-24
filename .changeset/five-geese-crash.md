---
'astro': major
---

Adjust default [View Transition](https://docs.astro.build/en/guides/view-transitions/) animations.

The `transition:animate` value `morph` has been renamed to `initial`. Elements with a `transition:name` directive but no `transition:animate` directive will now default to `fade`.

Astro also supports a new `transition:animate` values, `none`. This can be used to disable animated full page transitions by setting `transition:animate="none"` on your `html` element.
