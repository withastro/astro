---
'astro': minor
---

Adds a new, optional `kernel` configuration option to select a resize algorithm in the Sharp image service

By default, Sharp resizes images with the `lanczos3` kernel. This new config option allows you to set the default resizing algorithm to any resizing option supported by [Sharp](https://sharp.pixelplumbing.com/api-resize/#resize) (e.g. `linear`, `mks2021`).

Kernel selection can produce quite noticeable differences depending on various characteristics of the source image - especially drawn art - so changing the kernel gives you more control over the appearance of images on your site:

```js
export default defineConfig({
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        kernel: "mks2021"
      }
  }
})
```

This selection will apply to all images on your site, and is not yet configurable on a per-image basis. For more information, see [Sharps documentation on resizing images](https://sharp.pixelplumbing.com/api-resize/#resize).
