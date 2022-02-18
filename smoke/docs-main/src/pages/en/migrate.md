---
layout: ~/layouts/MainLayout.astro
title: Migration Guide
description: How to migrate your project to latest version of Astro.
---

## Migrate to v0.23

### Deprecated: Unescaped HTML

In Astro v0.23+, unescaped HTML content in expressions is now deprecated.
In future releases, content within expressions will have strings escaped to protect against unintended HTML injection.

```diff
- <h1>{title}</h1> <!-- <h1>Hello <strong>World</strong></h1> -->
+ <h1>{title}</h1> <!-- <h1>Hello &lt;strong&gt;World&lt;/strong&gt;</h1> -->
```

To continue injecting unescaped HTML, you can now use `set:html`.

```diff
- <h1>{title}</h1>
+ <h1 set:html={title} />
```

To avoid a wrapper element, `set:html` can work alongside `<Fragment>`.

```diff
- <h1>{title}!</h1>
+ <h1><Fragment set:html={title}>!</h1>
```

You can also protect against unintended HTML injection with `set:text`.

```astro
<h1 set:text={title} /> <!-- <h1>Hello &lt;strong&gt;World&lt;/strong&gt;</h1> -->
```

## Migrate to v0.21

### Vite

Starting in v0.21, Astro is built with [Vite].
As a result, configurations written in `snowpack.config.mjs` should be moved into `astro.config.mjs`.

```js
// @ts-check

/** @type {import('astro').AstroUserConfig} */
export default {
  renderers: [],
  vite: {
    plugins: [],
  },
};
```

To learn more about configuring Vite, please visit their [configuration guide](https://vitejs.dev/config/).

#### Vite Plugins

In Astro v0.21+, Vite plugins may be configured within `astro.config.mjs`.

```js
import { imagetools } from 'vite-imagetools';

export default {
  vite: {
    plugins: [imagetools()],
  },
};
```

To learn more about Vite plugins, please visit their [plugin guide](https://vitejs.dev/guide/using-plugins.html).

#### Vite Changes to Renderers

In Astro v0.21+, plugins should now use `viteConfig()`.

```diff
// renderer-svelte/index.js
+ import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  name: '@astrojs/renderer-svelte',
  client: './client.js',
  server: './server.js',
-  snowpackPlugin: '@snowpack/plugin-svelte',
-  snowpackPluginOptions: { compilerOptions: { hydratable: true } },
+  viteConfig() {
+    return {
+      optimizeDeps: {
+        include: ['@astrojs/renderer-svelte/client.js', 'svelte', 'svelte/internal'],
+        exclude: ['@astrojs/renderer-svelte/server.js'],
+      },
+      plugins: [
+        svelte({
+          emitCss: true,
+          compilerOptions: { hydratable: true },
+        }),
+      ],
+    };
+  },
}
```

To learn more about Vite plugins, please visit their [plugin guide](https://vitejs.dev/guide/using-plugins.html).

> In prior releases, these were configured with `snowpackPlugin` or `snowpackPluginOptions`.


### Aliasing

In Astro v0.21+, import aliases can be added from `tsconfig.json` or `jsconfig.json`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["src/components/*"]
    }
  }
}
```

_These aliases are integrated automatically into [VSCode](https://code.visualstudio.com/docs/languages/jsconfig) and other editors._

### File Extensions in Imports

In Astro v0.21+, files need to be referenced by their actual extension, exactly as it is on disk. In this example, `Div.tsx` would need to be referenced as `Div.tsx`, not `Div.jsx`.

```diff
- import Div from './Div.jsx' // Astro v0.20
+ import Div from './Div.tsx' // Astro v0.21
```

This same change applies to a compile-to-css file like `Div.scss`:

```diff
- <link rel="stylesheet" href={Astro.resolve('./Div.css')}>
+ <link rel="stylesheet" href={Astro.resolve('./Div.scss')}>
```

### Removed: Components in Frontmatter

Previously, you could create mini Astro Components inside of the Astro Frontmatter, using JSX syntax instead of Astro’s component syntax. This was always a bit of a hack, but in the new compiler it became impossible to support. We hope to re-introduce this feature in a future release of Astro using a different, non-JSX API.

To migrate to v0.21+, please convert all JSX Astro components (that is, any Astro components created inside of another component’s frontmatter) to standalone components.


### Styling Changes

#### Autoprefixer

Autoprefixer is no longer run by default. To enable:

1. Install the latest version (`npm i autoprefixer`)
2. Create a `postcss.config.cjs` file at the root of your project with:
   ```js
   module.exports = {
     plugins: {
       autoprefixer: {},
     },
   };
   ```

#### Tailwind CSS

Ensure you have PostCSS installed. This was optional in previous releases, but is required now:

1. Install the latest version of postcss (`npm i -D postcss`)
2. Create a `postcss.config.cjs` file at the root of your project with:
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
     },
   };
   ```
   For more information, read the [Tailwind CSS documentation](https://tailwindcss.com/docs/installation#add-tailwind-as-a-post-css-plugin)


### Known Issues

#### Imports on top

In Astro v0.21+, a bug has been introduced that requires imports inside components to be at the top of your frontmatter.

```astro
---
import Component from '../components/component.astro'
const whereShouldIPutMyImports = "on top!"
---
```


[vite]: https://vitejs.dev
