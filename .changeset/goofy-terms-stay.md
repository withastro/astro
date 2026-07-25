---
'astro': patch
---

Adds the missing `background` prop to the `<Image />` and `<Picture />` component types. The prop already worked at runtime, but was absent from the types, causing `astro check` to report that `background` does not exist on the component props
