---
'astro': patch
---

Fixes island CSS that was missing or loaded twice when one island imports a component statically and another loads it with `import()`

Styles of modules that an island loads with `import()` are now added to the page HTML, like the styles of modules that `client:only` components and scripts import, instead of being loaded only when the import runs.
