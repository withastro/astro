---
'astro': patch
---

Fixes the `Picture` component to forward the `class` prop to the `<picture>` element in addition to the `<img>` element. This allows layout-affecting CSS properties like `z-index` to work correctly when the `Picture` component is used inside flex or grid containers.
