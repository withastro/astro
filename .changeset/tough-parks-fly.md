---
'astro': patch
---

Fixes an issue where the experimental CSP `meta` element wasn't placed in the `<head>` element as early as possible, causing these policies to not apply to styles and scripts that came before the `meta` element.
