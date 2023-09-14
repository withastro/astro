---
'@astrojs/mdx': minor
---

Support the `img` component export for optimized images. This allows you to customize how optimized images are styled and rendered.

When rendering an optimized image, Astro will pass the `ImageMetadata` object to your `img` component as the `src` prop. For unoptimized images (i.e. images using URLs or absolute paths), Astro will continue to pass the `src` as a string.

This example handles both cases and applies custom styling:

```astro
---
// src/components/MyImage.astro
import type { ImageMetadata } from 'astro';
import { Image } from 'astro:assets';

type Props = {
	src: string | ImageMetadata;
	alt: string;
};

const { src, alt } = Astro.props;
---

{
	typeof src === 'string' ? (
		<img class="custom-styles" src={src} alt={alt} />
	) : (
		<Image class="custom-styles" {src} {alt} />
	)
}

<style>
	.custom-styles {
		border: 1px solid red;
	}
</style>
```

Now, this components can be applied to the `img` component props object or file export:

```md
import MyImage from '../../components/MyImage.astro';

export const components = { img: MyImage };

# My MDX article
```
