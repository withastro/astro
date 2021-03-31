---
layout: ../../layouts/content.astro
title: 'Babel'
tags: communityGuide
published: true
img: '/img/logos/babel.svg'
imgBackground: '#323330'
description: How to use Babel in your Snowpack project.
---

[Babel](https://babeljs.io/) is a popular JavaScript transpiler that includes a huge ecosystem of plugins.

**You probably don't need Babel!** Snowpack has built-in support for JSX and TypeScript transpilation. Only use Babel if you need to customize how your JavaScript/TypeScript files are built using custom Babel plugins/presets.

**To use Babel with Snowpack:** add the [@snowpack/plugin-babel](https://www.npmjs.com/package/@snowpack/plugin-babel) plugin to your project.

```diff
// snowpack.config.js
"plugins": [
+  ["@snowpack/plugin-babel"]
]
```
