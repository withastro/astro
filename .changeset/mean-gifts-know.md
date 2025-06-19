---
'astro': minor
'@astrojs/vercel': patch
---

The responsive images feature introduced behind a flag in [v5.0.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#500) is no longer experimental and is available for general use.

The new responsive images feature in Astro automatically generates optimized images for different screen sizes and resolutions, and applies the correct attributes to ensure that images are displayed correctly on all devices. 

Enable the `image.responsiveStyles` option in your Astro config. Then, set a `layout` attribute on any <Image /> or <Picture /> component, or configure a default `image.layout`, for instantly responsive images with automatically generated `srcset` and `sizes` attributes based on the image's dimensions and the layout type.

Displaying images correctly on the web can be challenging, and is one of the most common performance issues seen in sites. This new feature simplifies the most challenging part of the process: serving your site visitor an image optimized for their viewing experience, and for your website's performance.

For full details, see the updated [Image guide](https://docs.astro.build/en/guides/images/#responsive-image-behavior).

## Migration from Experimental Responsive Images

The `experimental.responsiveImages` flag has been removed, and all experimental image configuration options have been renamed to their final names.

If you were using the experimental responsive images feature, you'll need to update your configuration:

### Remove the experimental flag

```diff
export default defineConfig({
   experimental: {
-    responsiveImages: true,
   },
});
```

### Update image configuration options

During the experimental phase, default styles were applied automatically to responsive images. Now, you need to explicitly set the `responsiveStyles` option to `true` if you want these styles applied.

```diff
export default defineConfig({
  image: {
+    responsiveStyles: true,
  },
});
```

The experimental image configuration options have been renamed:

**Before:**
```js
export default defineConfig({
  image: {
    experimentalLayout: 'constrained',
    experimentalObjectFit: 'cover', 
    experimentalObjectPosition: 'center',
    experimentalBreakpoints: [640, 750, 828, 1080, 1280],
    experimentalDefaultStyles: true, 
  },
  experimental: {
    responsiveImages: true,
  },
});
```

**After:**
```js
export default defineConfig({
  image: {
    layout: 'constrained',
    objectFit: 'cover',
    objectPosition: 'center', 
    breakpoints: [640, 750, 828, 1080, 1280],
    responsiveStyles: true, // This is now *false* by default
  },
});
```

### Component usage remains the same

The `layout`, `fit`, and `position` props on `<Image>` and `<Picture>` components work exactly the same as before:

```astro
<Image 
  src={myImage} 
  alt="A responsive image"
  layout="constrained"
  fit="cover"
  position="center"
/>
```

If you weren't using the experimental responsive images feature, no changes are required.

Please see the [Image guide](https://docs.astro.build/en/guides/images/#responsive-image-behavior) for more information on using responsive images in Astro.
