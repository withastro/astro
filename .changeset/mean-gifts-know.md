---
'astro': minor
'@astrojs/vercel': patch
---

Responsive images are now stable.

The responsive images feature is now stable and enabled by default. The `experimental.responsiveImages` flag has been removed, and all experimental image configuration options have been renamed to their final names.

## Migration Guide

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
