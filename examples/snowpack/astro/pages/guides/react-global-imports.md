---
layout: layouts/content.astro
title: React + babel-plugin-import-global
published: false
---

<div class="notification">
  This guide has an example repo:
  <a href="https://github.com/snowpackjs/snowpack/examples/react-global-imports">examples/react-global-imports</a>
</div>

_Based on [app-template-react][app-template-react]_

Example of using Snowpack in conjuction with [babel-plugin-import-global][babel-plugin-import-global]. This is useful when you need to need to inject an import statement at the top of every file, such as React:

```jsx
// "import React from 'react'" no longer needed!
function MyComponent() {
  // …
}

export default MyComponent;
```

To recreate this setup, follow 2 steps:

1. Create a [babel.config.js](./babel.config.js) file in the root of the project. Copy the settings shown.
2. Install [@snowpack/plugin-babel][snowpack-babel] and add it to [snowpack.config.js](./snowpack.config.js)

### ⚠️ Caveat

When you use [@snowpack/plugin-babel][snowpack-babel], you miss out on the faster builds that come from Snowpack‘s default JS builder, [esbuild][esbuild] (we don‘t run both together to avoid conflict). However, if you skip Babel, you will have to manually place `import` statements yourself at the top of every file.

We‘d recommend being explicit and manually managing every `import` statement yourself. You can simplify your setup, speed up your builds, and you might see benefits from being explicit. In order to do this, simply use our [React starter template][app-template-react]. No setup required.

But if you‘ve weighed the tradeoffs and decide that a slower build is worth it to get global import functionality, then start from the example here.

[app-template-react]: https://github.com/snowpackjs/snowpack/create-snowpack-app/app-template-react
[babel-plugin-import-global]: https://www.npmjs.com/package/babel-plugin-import-global
[esbuild]: https://esbuild.github.io/
[snowpack-babel]: https://github.com/snowpackjs/snowpack/plugins/plugin-babel
