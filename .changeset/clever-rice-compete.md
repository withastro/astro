---
'astro': patch
---

Add CSS variables in `getImage` for `experimental.responsiveImages`

Previously, the responsive images experiment only applied to the `<Image />` and `<Picture />` components. However, images included through Markdown would not have the same styling applied to them, unless using MDX. This change consolidates more styling into `getImage` so it is accessible in more places.