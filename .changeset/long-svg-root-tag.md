---
'astro': patch
---

Fixes a `NoImageMetadata` error for SVG images whose root `<svg>` tag ends after the first kilobyte, such as diagrams exported from draw.io
