---
'astro': minor
---

Adds experimental support for generating `srcset` attributes and a new `<Picture />` component.

## `srcset` support

Two new properties have been added to `Image` and `getImage()`: `densities` and `widths`.

These properties can be used to generate a `srcset` attribute, either based on absolute widths in pixels (e.g. [300, 600, 900]) or pixel density descriptors (e.g. `["2x"]` or `[1.5, 2]`).


```astro
---
import { Image } from "astro";
import myImage from "./my-image.jpg";
---

<Image src={myImage} width={myImage.width / 2} densities={[1.5, 2]} alt="My cool image"  />
```

```html
<img
  src="/_astro/my_image.hash.webp"
  srcset="/_astro/my_image.hash.webp 1.5x, /_astro/my_image.hash.webp 2x"
  alt="My cool image"
/>
```

## Picture component

The experimental `<Picture />` component can be used to generate a `<picture>` element with multiple `<source>` elements.

The example below uses the `format` property to generate a `<source>` in each of the specified image formats:

```astro
---
import { Picture } from "astro:assets";
import myImage from "./my-image.jpg";
---

<Picture src={myImage} formats={["avif", "webp"]} alt="My super image in multiple formats!" />
```

The above code will generate the following HTML, and allow the browser to determine the best image to display:

```html
<picture>
  <source srcset="..." type="image/avif" />
  <source srcset="..." type="image/webp" />
  <img src="..." alt="My super image in multiple formats!" />
</picture>
```

The `Picture` component takes all the same props as the `Image` component, including the new `densities` and `widths` properties.
