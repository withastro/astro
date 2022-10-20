---
'@astrojs/image': minor
---

HTML attributes included on the `<Picture />` component are now passed down to the underlying `<img />` element.

**Why?** 

- when styling a `<picture>` the `class` and `style` attributes belong on the `<img>` itself
- `<picture>` elements [should not](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture#attributes) actually provide any `aria-` attributes
- `width` and `height` can be added to the `<img>` to help prevent layout shift
