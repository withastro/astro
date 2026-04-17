---
'astro': patch
---

Fix UnoCSS `@apply` and `--at-apply` styles breaking on ClientRouter soft navigations during `astro dev`. CSS is now cached after integration plugins have processed it, and Astro component styles are persisted across navigations.