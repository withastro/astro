---
'@astrojs/image': minor
---

Removes the `content-visibility: auto` styling added by the `<Picture />` and `<Image />` components.

**Why:** The [content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) style is rarely needed for an `<img>` and can actually break certain layouts.

**Migration:** Do images in your layout actually depend on `content-visibility`?  No problem!  You can add these styles where needed in your own component styles.
