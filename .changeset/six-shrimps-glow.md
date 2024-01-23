---
"astro": patch
---

Fix regression in routing priority for index pages in rest parameter folders and dynamic sybling trees.

Considering the following tree:
```
src/pages/
├── index.astro
├── static.astro
├── [dynamic]/
│   ├── index.astro
│   ├── [...rest].astro
│   └── static.astro
└── [...rest]/
    ├── index.astro
    └── static.astro
```

The routes are sorted in this order:
```
/src/pages/static.astro
/src/pages/index.astro
/src/pages/[dynamic]/static.astro
/src/pages/[dynamic]/index.astro
/src/pages/[dynamic]/[...rest].astro
/src/pages/[...rest]/static.astro
/src/pages/[...rest]/index.astro
```
