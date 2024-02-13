---
"astro": minor
---

Adds a new optional `astro:assets` image attribute `inferSize` for use with remote images.

Remote images can now have their dimensions inferred just like local images. Setting `inferSize` to `true` allows you to use `getImage()` and the `<Image />` and `<Picture />` components without setting the `width` and `height` properties.

```astro
---
import { Image, Picture, getImage } from 'astro:assets';
const myPic = await getImage({src: "https://example.com/example.png", inferSize: true, alt: ""})
---
<Image src="https://example.com/example.png" inferSize={true} alt="">
<Picture src="https://example.com/example.png" inferSize={true} alt="">
```

Read more about [using `inferSize` with remote images](https://docs.astro.build/en/guides/images/#infersize) in our documentation.
