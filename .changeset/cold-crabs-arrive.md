---
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds support for [Shiki's `defaultColor` option](https://shiki.style/guide/dual-themes#without-default-color).

This option allows you to override the values of a theme's inline style, adding only CSS variables to give you more flexibility in applying multiple color themes.

Configure `defaultColor: false` in your Shiki config to apply throughout your site, or pass to Astro's built-in `<Code>` component to style an individual code block.

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
});
```

```astro
---
import { Code } from 'astro:components';
---
<Code code={`const useMyColors = true`} lang="js" defaultColor={false} />
```
