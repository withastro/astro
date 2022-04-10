---
'astro': patch
---

Add support for advanced CSS imports with `?raw` and `?url`

> ⚠️WARNING⚠️:
> Be careful when bypassing Astro's built-in CSS bundling! Styles won't be included in the built output - this is best used in combination with `set:html` to inline styles directly into the built HTML page.