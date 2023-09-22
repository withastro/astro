---
'astro': minor
---

Add support for generating multiple widths when using the Image component and a Picture component for supporting multiple formats.

## `srcset` support

The current usage is as follow:

```astro
---
import { Image } from "astro";
import myImage from "./my-image.jpg";
---

<Image src={myImage} densities={[2, 3]} alt="My cool image"  />
```

Alternatively to `densities`, `widths` can be used for specific widths. In both cases, according images and the following code will be generated:

```html
<img src="..." srcset="... 2x, ... 3x" alt="My cool image" />
```

(if `widths` is used the descriptor will be `w` instead of `x`)

## Picture component

The `Picture` component can be used to generate a `<picture>` element with multiple sources. It can be used as follow:

```astro
---
import { Picture } from "astro:assets";
import myImage from "./my-image.jpg";
---

<Picture src={myImage} formats=["avif", "webp"] alt="My super image in multiple formats!" />
```

The above code will generate the following:

```html
<picture>
  <source srcset="..." type="image/avif" />
  <source srcset="..." type="image/webp" />
  <img src="..." alt="My super image in multiple formats!" />
</picture>
```

The `Picture` component takes all the same props as the `Image` component, including `densities` and `widths`.
