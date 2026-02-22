---
'astro': patch
---

fix(assets): prevent circular dependency deadlock with SVG images in content collections

SVG images referenced in content collections were causing a deadlock due to a circular dependency between the assets plugin and the server runtime. Content collection SVGs now return plain image metadata instead of full inline components, avoiding the circular import when combined with top-level await (TLA).
