---
'astro': minor
---

Adds experimental SVGO optimization support for SVG assets

Astro now supports automatic SVG optimization using SVGO during build time. This experimental feature helps reduce SVG file sizes while maintaining visual quality, improving your site's performance.

To enable SVG optimization, add the following to your `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    svg: {
      optimize: true,
    },
  },
});
```

You can customize SVGO behavior by providing your own configuration:
```js
export default defineConfig({
  experimental: {
    svg: {
      optimize: true,
      svgoConfig: {
        plugins: ['preset-default'],
      },
    },
  },
});
```

The feature includes graceful error handling - if optimization fails for any SVG, Astro will fall back to using the original file content.

For more information on enabling and using this feature in your project, see the [Experimental SVG Optimization docs](https://docs.astro.build/en/reference/experimental-flags/svg/).
