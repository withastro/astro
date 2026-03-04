---
'astro': patch
---

Improves `.astro` component SSR rendering performance by up to 2x. 

This includes several optimizations to the way that Astro generates and renders components on the server. These are mostly micro-optimizations, but they add up to a significant improvement in performance. Most pages will benefit, but pages with many components will see the biggest improvement, as will pages with lots of strings (e.g. text-heavy pages with lots of HTML elements).
