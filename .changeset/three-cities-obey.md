---
'astro': patch
---

Fixed the `position` prop in `<Image />` and `<Picture />` to correctly apply `object-position` styles.

Before fixing, providing a `position` prop only added `data-astro-image-pos` attribute to the HTML, but the corresponding CSS was not generated. 

This fix ensures the `position` value is applied inline `object-position` style directly.
