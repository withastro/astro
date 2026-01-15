---
'astro': major
---

Adds support for converting SVGs to raster images (PNGs, WebP, etc) to the default Sharp image service.

Previously, the following code would have silently ignored the `format` property and the result would remain a SVG:

```astro
<Image src={mySvg} format="avif" alt="" />
```

After this update, this will now result in an AVIF file being generated.
