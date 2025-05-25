---
'astro': patch
---

Allows disabling default styles for responsive images

This change adds a new `image.experimentalDefaultStyles` option that allows you to disable the default styles applied to responsive images. 

When using experimental responsive images, Astro applies default styles to ensure the images resize correctly. In most cases this is what you want – and they are applied with low specificity so your own styles override them. However in some cases you may want to disable these default styles entirely. This is particularly useful when using Tailwind 4, because it uses CSS cascade layers to apply styles, making it difficult to override the default styles.

`image.experimentalDefaultStyles` is a boolean option that defaults to `true`, so you can change it in your Astro config file like this:

```js
export default {
  image: {
    experimentalDefaultStyles: false,
  },
  experimental: {
    responsiveImages: true,
  },
};
```
