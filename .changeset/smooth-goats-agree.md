---
'astro': minor
---

Add support for generating multiple widths when using the Image component and a Picture component for supporting multiple formats.

## `srcset` support

Two new properties have been added to `Image` and `getImage`: `densities` and `widths`.

These props can be used to generate a `srcset` attribute with multiple sources. For example:

```astro
---
import { Image } from "astro";
import myImage from "./my-image.jpg";
---

<Image src={myImage} width={myImage.width / 2} densities={[2]} alt="My cool image"  />
```

```html
<img src="..." srcset="... 2x, ... 3x" alt="My cool image" />
```

## Picture component

The `Picture` component can be used to generate a `<picture>` element with multiple sources. It can be used as follow:

```astro
---
import { Picture } from "astro:assets";
import myImage from "./my-image.jpg";
---

<Picture src={myImage} formats={["avif", "webp"]} alt="My super image in multiple formats!" />
```

The above code will generate the following:

```html
<picture>
  <source srcset="..." type="image/avif" />
  <source srcset="..." type="image/webp" />
  <img src="..." alt="My super image in multiple formats!" />
</picture>
```

The `Picture` component takes all the same props as the `Image` component, including the new `densities` and `widths` properties.
