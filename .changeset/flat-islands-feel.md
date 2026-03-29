---
'astro': patch
---

Fixed a regression where .html was unexpectedly stripped from dynamic route parameters. This ensures that getStaticPaths can correctly match paths that intentionally include a .html extension.
