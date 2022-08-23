---
'astro': patch
---

Deterministic CSS ordering

This makes our CSS link order deterministic. It uses CSS depth; that is how deeply a module import the CSS comes from, in order to determine which CSS is page-level vs. component-level CSS.

This is intended to match dev ordering where, because we do not bundle, the page-level CSS always comes after component-level.
