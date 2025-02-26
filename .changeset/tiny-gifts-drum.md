---
'@astrojs/vercel': minor
---

Adds support for regular expressions in ISR exclude list

Previously, excluding a page from ISR required explicitly listing it in `isr.exclude`. As websites grew larger, maintaining this list became increasingly difficult, especially for multiple API routes and pages that needed server-side rendering.

To address this, ISR exclusions now support regular expressions, allowing for more flexible and scalable configurations.

```js
// astro.config.mjs
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    isr: {
      exclude: [
        '/preview',      // Excludes a specific route (e.g., pages/preview.astro)
        '/auth/[page]',  // Excludes a dynamic route (e.g., pages/auth/[page].astro)
        /^\/api\/.+/,    // Excludes all routes starting with /api/
      ]
    }
  })
});
```
