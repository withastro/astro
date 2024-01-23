---
"astro": patch
---

Fixes a regression in routing priority for index pages in rest parameter folders and dynamic sibling trees.

Considering the following tree:
```
src/pages/
├── index.astro
├── static.astro
├── [dynamic_file].astro
├── [...rest_file].astro
├── blog/
│   └── index.astro
├── [dynamic_folder]/
│   ├── index.astro
│   ├── static.astro
│   └── [...rest].astro
└── [...rest_folder]/
    ├── index.astro
    └── static.astro
```

The routes are sorted in this order:
```
/src/pages/index.astro
/src/pages/blog/index.astro
/src/pages/static.astro
/src/pages/[dynamic_folder]/index.astro
/src/pages/[dynamic_file].astro
/src/pages/[dynamic_folder]/static.astro
/src/pages/[dynamic_folder]/[...rest].astro
/src/pages/[...rest_folder]/static.astro
/src/pages/[...rest_folder]/index.astro
/src/pages/[...rest_file]/index.astro
```

This allows for index files to be used as overrides to rest parameter routes on SSR when the rest parameter matching `undefined` is not desired.
