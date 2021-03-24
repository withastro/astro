---
layout: layouts/content.astro
title: 'Tailwind CSS'
tags: communityGuide
published: true
img: '/img/logos/tailwind.svg'
imgBackground: '#f2f8f8'
description: How to use Tailwind CSS with Snowpack.
---

[Tailwind](https://tailwindcss.com) is a popular class-based CSS utility library.

### Using Tailwind with Native CSS

The easiest way to use Tailwind is via native CSS `@import` _or_ JS `import`.

```css
/* index.css */
@import 'tailwindcss/dist/tailwind.css';
```

```js
/* index.js */
import 'tailwindcss/dist/tailwind.css';
```

This imports Tailwind's full CSS build into your application. This simple usage comes at the cost of performance: Tailwind's full CSS build is 3.5+ MB of CSS. For any serious production use, the Tailwind team **strongly** recommends using [PostCSS](https://postcss.org/).

#### Using Tailwind with PostCSS

Follow our [PostCSS guide](/guides/postcss) to set up PostCSS in your Snowpack project. Then, add Tailwind and autoprefixer as plugins to your `postcss.config.js`:

```js
// postcss.config.js
// Taken from: https://tailwindcss.com/docs/installation#using-tailwind-with-postcss
module.exports = {
  plugins: [
    // ...
    require('tailwindcss'),
    require('autoprefixer'),
    // ...
  ],
};
```

Once the plugin is enabled, you can replace your native CSS `dist` imports with Tailwind's more powerful `base`, `components`, and `utilities` imports:

```diff
/* index.css */
- @import 'tailwindcss/dist/tailwind.css';
+ @tailwind base;
+ @tailwind components;
+ @tailwind utilities;

```

Follow the official [Tailwind CSS Docs](https://tailwindcss.com/docs/installation/#using-tailwind-with-postcss) for more information.
