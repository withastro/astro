---
'@astrojs/netlify': minor
---

The Netlify adapter builds to a single function by default. Astro 2.7 added support for splitting your build into separate entry points per page. If you use this configuration, the Netlify adapter will generate a separate function for each page. This can help reduce the size of each function so they are only bundling code used on that page.


  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import netlify from '@astrojs/netlify/functions';

  export default defineConfig({
    output: 'server',
    adapter: netlify(),
    build: {
      split: true,
    },
  });
  ```