---
layout: ../../layouts/content.astro
title: 'Sass'
tags: communityGuide
published: true
img: '/img/logos/sass.svg'
imgBackground: '#bf4080'
description: How to use SASS with Snowpack using the Snowpack SASS plugin
---

<div class="stub">
This article is a stub, you can help expand it into <a href="https://documentation.divio.com/how-to-guides/">guide format</a>
</div>

[Sass](https://www.sass-lang.com/) is a stylesheet language that’s compiled to CSS. It allows you to use variables, nested rules, mixins, functions, and more, all with a fully CSS-compatible syntax. Sass helps keep large stylesheets well-organized and makes it easy to share design within and across projects.

**To use Sass with Snowpack:** use [@snowpack/plugin-sass](https://www.npmjs.com/package/@snowpack/plugin-sass).

```diff
// snowpack.config.js
"plugins": [
+  "@snowpack/plugin-sass"
]
```
