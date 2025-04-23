---
'astro': patch
---

Simplifies styles for experimental responsive images

:warning: **BREAKING CHANGE FOR EXPERIMENTAL RESPONSIVE IMAGES ONLY** :warning:

The generated styles for image layouts are now simpler and easier to override. Previously it used CSS to set the size and aspect ratio of the images, but this is no longer needed. Now it just sets `object-fit` and `object-position`, and sets `max-width: 100%` for constrained images and `width: 100%` for full-width images.

The styles now use the [`:where()` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:where), which has a [specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity) of 0, meaning that it is easy to override with your own styles. You can now be sure that your own classes will always override the applied styles, as will global styles on `img`.

An exception is Tailwind 4, which uses [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), meaning the rules are always lower specificity. Astro supports browsers that do not support cascade layers, so we cannot use this. If you need to override the styles using Tailwind 4, you must use `!important` classes. Do check if this is needed though: there may be a layout that is more appropriate for your use case.
