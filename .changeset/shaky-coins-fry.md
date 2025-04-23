---
'astro': patch
---

Simplifies styles for experimental responsive images

:warning: **BREAKING CHANGE FOR EXPERIMENTAL RESPONSIVE IMAGES ONLY** :warning:

The generated styles for image layouts are now simpler and easier to override. Previously the responsive image component used CSS to set the size and aspect ratio of the images, but this is no longer needed. Now the styles just include `object-fit` and `object-position` for all images, and sets `max-width: 100%` for constrained images and `width: 100%` for full-width images.

This is an implementation change only, and most users will see no change. However, it may affect any custom styles you have added to your responsive images. Please check your rendered images to determine whether any change to your CSS is needed.

The styles now use the [`:where()` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:where), which has a [specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity) of 0, meaning that it is easy to override with your own styles. You can now be sure that your own classes will always override the applied styles, as will global styles on `img`.

An exception is Tailwind 4, which uses [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), meaning the rules are always lower specificity. Astro supports browsers that do not support cascade layers, so we cannot use this. If you need to override the styles using Tailwind 4, you must use `!important` classes. Do check if this is needed though: there may be a layout that is more appropriate for your use case.
