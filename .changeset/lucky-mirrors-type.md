---
'@astrojs/image': minor
---

`<Image />` and `<Picture />` now support using images in the `/public` directory :tada:

- Moving handling of local image files into the Vite plugin
- Optimized image files are now built to `/dist` with hashes provided by Vite, removing the need for a `/dist/_image` directory
- Removes three npm dependencies: `etag`, `slash`, and `tiny-glob`
- Replaces `mrmime` with the `mime` package already used by Astro's SSR server
- Simplifies the injected `_image` route to work for both `dev` and `build`
- Adds a new test suite for using images with `@astrojs/mdx` - including optimizing images straight from `/public`
