---
'astro': minor
'@astrojs/vercel': patch
---

Responsive images are now stable! The experimental responsive images feature is now stable and enabled by default. The `experimental.responsiveImages` flag has been removed, and all experimental image configuration options have been renamed to their final names.

## Migration Guide

If you were using the experimental responsive images feature, you'll need to update your configuration:

### Remove the experimental flag

**Before:**
```js
export default defineConfig({
  experimental: {
    responsiveImages: true, // Remove this
  },
});
```

**After:**
```js
export default defineConfig({
  // No experimental flag needed
});
```

### Update image configuration options

The experimental image configuration options have been renamed:

**Before:**
```js
export default defineConfig({
  image: {
    experimentalLayout: 'constrained',
    experimentalObjectFit: 'cover', 
    experimentalObjectPosition: 'center',
    experimentalBreakpoints: [640, 750, 828, 1080, 1280],
    experimentalDefaultStyles: true, // This is true by default for responsive images
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
    defaultStyles: true, // This is true by default for responsive images
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
