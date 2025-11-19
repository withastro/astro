---
'astro': minor
---

Adds experimental SVGO optimization support for SVG assets

Astro now supports automatic SVG optimization using SVGO during build time. This experimental feature helps reduce SVG file sizes while maintaining visual quality, improving your site's performance.

To enable SVG optimization with default settings, add the following to your `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    svgo: true,
  },
});
```

To customize optimization, pass a [SVGO configuration object](https://svgo.dev/docs/plugins/):

```js
export default defineConfig({
  experimental: {
    svgo: {
      plugins: [
        'preset-default',
        {
          name: 'removeViewBox',
          active: false
        }
      ],
    },
  },
});
```

For more information on enabling and using this feature in your project, see the [experimental SVG optimization docs](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/).
