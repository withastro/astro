---
"astro": minor
---

Remote images can now have their dimensions inferred just like local images, allow width and height to be optional when inferSize is set to true.

```astro
---
import { Image, Picture, getImage } from 'astro:assets';
const myPic = await getImage({src: "https://example.com/example.png", inferSize: true, alt: ""})
---
<Image src="https://example.com/example.png" inferSize={true} alt="">
<Picture src="https://example.com/example.png" inferSize={true} alt="">
```


> added to trigger tests
