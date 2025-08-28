---
'astro': patch
---

Adds support for experimental CSP when using experimental fonts

Experimental fonts now integrate well with experimental CSP by injecting hashes for the styles it generates, as well as `font-src` directives.

No action is required to benefit from it.
