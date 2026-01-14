---
'astro': minor
---

Adds a new `background` property to the `<Image />` component.

This optional property lets you pass a background color to flatten the image with. By default, when Sharp needs to flatten an image because it's being converted to a format that does not support transparency (e.g. `jpeg`), it uses a black background for that. Providing a value for `background` on an `<Image />` component, or passing it to the `getImage()` helper, will flatten images using that color instead.

This is especially useful when the requested output format doesn't support an alpha channel (e.g. `jpeg`) and can't support transparent backgrounds.

```astro
---
import { Image } from 'astro:assets';
---
<Image
  src="/transparent.png"
  alt="A JPEG with a white background!"
  format="jpeg"
  background="#ffffff"
/>
```

See more about this new property in [the image reference docs](https://docs.astro.build/en/reference/modules/astro-assets/#background)
