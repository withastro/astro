---
'@astrojs/cloudflare': patch
---

Fixes a bug where original image files referenced directly in markup (e.g. `<a href={img.src}>`) were deleted from the build output when using `imageService: 'compile'` with workerd prerendering. The `referencedImages` set tracked in workerd is now transferred back to Node so the image pipeline preserves originals that are still in use.
