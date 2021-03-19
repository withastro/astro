---
layout: layouts/content.hmx
title: 'PostCSS'
tags: communityGuide
published: true
img: '/img/logos/postcss.svg'
imgBackground: '#f8f8f2'
description: How to use PostCSS in your Snowpack project.
---

[PostCSS](https://postcss.org/) is a popular CSS transpiler with support for [a huge ecosystem of plugins.](https://github.com/postcss/postcss#plugins)

**To use PostCSS with Snowpack:** add the [@snowpack/plugin-postcss](https://www.npmjs.com/package/@snowpack/plugin-postcss) plugin to your project.

```diff
// snowpack.config.js
"plugins": [
+  "@snowpack/plugin-postcss"
]
```

PostCSS requires a [`postcss.config.js`](https://github.com/postcss/postcss#usage) file in your project. By default, the plugin looks in the root directory of your project, but you can customize this yourself with the `config` option. See [the plugin README](https://www.npmjs.com/package/@snowpack/plugin-postcss) for all available options.

```js
// postcss.config.js
// Example (empty) postcss config file
module.exports = {
  plugins: [
    // ...
  ],
};
```

Be aware that this plugin will run on all CSS in your project, including any files that compiled to CSS (like `.scss` Sass files, for example).
