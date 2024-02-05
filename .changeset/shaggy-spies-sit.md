---
"@astrojs/markdoc": minor
---

Adds support for using a custom tag (component) for optimized images

Starting from this version, when a tag called `image` is used, its `src` attribute will automatically be resolved if it's a local image. Astro will pass the result `ImageMetadata` object to the underlying component as the `src` prop. For non-local images (i.e. images using URLs or absolute paths), Astro will continue to pass the `src` as a string.

```ts
// markdoc.config.mjs
import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	tags: {
		image: {
			attributes: nodes.image.attributes,
			render: component('./src/components/MarkdocImage.astro'),
		},
	},
});
```
```astro
---
// src/components/MarkdocImage.astro
import { Image } from "astro:assets";

interface Props {
  src: ImageMetadata | string;
  alt: string;
  width: number;
  height: number;
}

const { src, alt, width, height } = Astro.props;
---

<Image {src} {alt} {width} {height} />
```
```mdoc
{% image src="./astro-logo.png" alt="Astro Logo" width="100" height="100" %}
``````
