---
'astro': minor
---

Adds a new property `propertiesToHash` to the Image Services API to allow specifying which properties of `getImage()` / `<Image />` / `<Picture />` should be used for hashing the result files when doing local transformations. For most services, this will include properties such as `src`, `width` or `quality` that directly changes the content of the generated image.
