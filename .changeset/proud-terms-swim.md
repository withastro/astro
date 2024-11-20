---
'astro': minor
---

Adds experimental support for automatic responsive images

This feature is experimental and may change in future versions. To enable it, set `experimental.responsiveImages` to `true` in your `astro.config.mjs` file.

 ```js title=astro.config.mjs
 {
  	experimental: {
 			responsiveImages: true,
 		},
 }
 ```

 When this flag is enabled, you can pass a `layout` props to any `<Image />` or `<Picture />` component to create a responsive image. When a layout is set, images have automatically generated `srcset` and `sizes` attributes based on the image's dimensions and the layout type. Images with `responsive` and `full-width` layouts will have styles applied to ensure they resize according to their container.

 ```astro
 // MyComponent.astro
 ---
 import { Image, Picture } from 'astro:assets';
 import myImage from '../assets/my_image.png';
 ---
 <Image src={myImage} alt="A description of my image." layout='responsive' width={800} height={600} />
 <Picture src={myImage} alt="A description of my image." layout='full-width' formats={['avif', 'webp', 'jpeg']} />
 ```
 This `<Image />` component will generate the following HTML output:
 ```html title=Output

 	<img
		src="/_astro/my_image.hash3.webp"
		srcset="/_astro/my_image.hash1.webp 640w,
						/_astro/my_image.hash2.webp 750w,
						/_astro/my_image.hash3.webp 800w,
						/_astro/my_image.hash4.webp 828w,
						/_astro/my_image.hash5.webp 1080w,
						/_astro/my_image.hash6.webp 1280w,
						/_astro/my_image.hash7.webp 1600w"
		alt="A description of my image"
		sizes="(min-width: 800px) 800px, 100vw"
		loading="lazy"
		decoding="async"
		fetchpriority="auto"
		width="800"
		height="600"
		style="--w: 800; --h: 600; --fit: cover; --pos: center;"
		data-astro-image="responsive"
  >
 ```

 The following styles are applied to ensure the images resize correctly:

 ```css
 [data-astro-image] {
 		width: 100%;
 		height: auto;
 		object-fit: var(--fit);
 		object-position: var(--pos);
 		aspect-ratio: var(--w) / var(--h)
 }

 [data-astro-image=responsive] {
 		max-width: calc(var(--w) * 1px);
 		max-height: calc(var(--h) * 1px)
 }

 [data-astro-image=fixed] {
 		width: calc(var(--w) * 1px);
 		height: calc(var(--h) * 1px)
 }
 ```
 You can enable responsive images for all `<Image />` and `<Picture />` components by setting `image.experimentalLayout` with a default value. This can be overridden by the `layout` prop on each component.

 **Example:**
 ```js title=astro.config.mjs
 {
 		image: {
 			// Used for all `<Image />` and `<Picture />` components unless overridden
 			experimentalLayout: 'responsive',
 		},
 		experimental: {
 			responsiveImages: true,
 		},
 }
 ```

 ```astro title=MyComponent.astro
 ---
 import { Image } from 'astro:assets';
 import myImage from '../assets/my_image.png';
 ---

 <Image src={myImage} alt="This will use responsive layout" width={800} height={600} />

 <Image src={myImage} alt="This will use full-width layout" layout="full-width" />

 <Image src={myImage} alt="This will disable responsive images" layout="none" />
 ```

 #### Responsive image properties

 These are additional properties available to the `<Image />` and `<Picture />` components when responsive images are enabled:

 - `layout`: The layout type for the image. Can be `responsive`, `fixed`, `full-width` or `none`. Defaults to value of `image.experimentalLayout`.
 - `fit`: Defines how the image should be cropped if the aspect ratio is changed. Values match those of CSS `object-fit`. Defaults to `cover`, or the value of `image.experimentalObjectFit` if set.
 - `position`: Defines the position of the image crop if the aspect ratio is changed. Values match those of CSS `object-position`. Defaults to `center`, or the value of `image.experimentalObjectPosition` if set.
 - `priority`: If set, eagerly loads the image. Otherwise images will be lazy-loaded. Use this for your largest above-the-fold image. Defaults to `false`.

The `widths` and `sizes` attributes are automatically generated based on the image's dimensions and the layout type, and in most cases should not be set manually. The generated `sizes` attribute for `responsive` and `full-width` images
is based on the assumption that the image is displayed at close to the full width of the screen when the viewport is smaller than the image's width. If it is significantly different (e.g. if it's in a multi-column layout on small screens) you may need to adjust the `sizes` attribute manually for best results.

The `densities` attribute is not compatible with responsive images and will be ignored if set.
