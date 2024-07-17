---
"astro": minor
---

Adds a new `inferRemoteSize()` function that can be used to infer the dimensions of a remote image.

Previously, the ability to infer these values was only available by adding the [`inferSize`] attribute to the `<Image>` and `<Picture>` components or `getImage()`. Now, you can also access this data outside of these components. 
 
This is useful for when you need to know the dimensions of an image for styling purposes or to calculate different densities for responsive images.

```astro
---
import { inferRemoteSize, Image } from 'astro:assets';

const imageUrl = 'https://...';
const { width, height } = await inferRemoteSize(imageUrl);
---

<Image src={imageUrl} width={width / 2} height={height} densities={[1.5, 2]}  />
```
