---
'astro': major
---

Change the [View Transition built-in animation](https://docs.astro.build/en/guides/view-transitions/#built-in-animation-directives) options.

The `transition:animate` value `morph` has been renamed to `initial`. Also, this is no longer the default animation.

 If no `transition:animate` directive is specified, your animations will now default to `fade`.

Astro also supports a new `transition:animate` values, `none`. This can be used to disable animated full page transitions by setting `transition:animate="none"` on your `html` element.
