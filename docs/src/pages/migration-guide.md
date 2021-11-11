---
layout: ~/layouts/MainLayout.astro
title: Migrate to v0.21
description: How to migrate projects from Astro v0.20.
---

Starting in v0.21, Astro is now built with [Vite].
As a result, configurations written in `snowpack.config.mjs` should be moved into `astro.config.mjs`.

```js
// @ts-check

/** @type {import('astro').AstroUserConfig} */ 
export default ({
  renderers: [],
  vite: {
    plugins: []
  }
})
```

To learn more about configuring Vite, please visit their [configuration guide](https://vitejs.dev/config/).



## Aliases

In Astro v0.21, import aliases can be added using `tsconfig.json` or `jsconfig.json`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"]
    }
  }
}
```

These aliases are integrated automatically into [VSCode](https://code.visualstudio.com/docs/languages/jsconfig) and other editors.



## Passing variables into scripts and styles

In Astro v0.21, server-side variables can be passed into client-side `<style>` or `<script>`.

```astro
---
// tick.astro
const colors = { foregroundColor: "rgb(221 243 228)", backgroundColor: "rgb(24 121 78)" }
---
<style define:vars={colors}>
  h-tick {
    background-color: var(--backgroundColor);
    border-radius: 50%;
    color: var(--foregroundColor);
    height: 15px;
    width: 15px;
  }
</style>
<h-tick>✓</h-tick>
```



## Components in Markdown

In Astro v0.21, Components from any framework can be used within Markdown files.

```md
---
Layout: '...'
setup: | 
  import MyReactComponent from '../components/MyReactComponent.jsx'
---

# Hydrating on visibility

<MyReactComponent client:visible>

# Hello world!

</MyReactComponent>
```



## Environment variables

In Astro v0.21, environment variables are loaded from `.env` files in your project directory.

```ini
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

For security purposes, only variables prefixed with `PUBLIC_` are accessible to your code.
In prior releases, these variables were prefixed with `SNOWPACK_PUBLIC_` and required the `@snowpack/plugin-env` plugin.

**Example**

```ini
SECRET_PASSWORD=password123
PUBLIC_ANYBODY=there
```

In that example, only `PUBLIC_ANYBODY` will be exposed as `import.meta.env.PUBLIC_ANYBODY` to your client source code, but `SECRET_PASSWORD` will not.



## File references

In Astro v0.21, files need to be referenced with their extension exactly as it is on disk.

This means that `file.tsx` files need to be referenced as `file.tsx` and not as `file.jsx`.

**Example**

```tsx
// Div.tsx
export default function Div(props) {
  return <div />
}
```

```diff
- import Div from './Div.jsx' // Astro v0.20
+ import Div from './Div.tsx' // Astro v0.21
```

```scss
// Div.scss
div {
  all: unset
}
```

```diff
- <link rel="stylesheet" href={Astro.resolve('./Div.css')}>
+ <link rel="stylesheet" href={Astro.resolve('./Div.scss')}>
```



## Applying plugins

In Astro v0.21, plugins are configured in `vite.plugins`.

```js
import { imagetools } from 'vite-imagetools'

export default {
  vite: {
    plugins: [
      imagetools()
    ]
  }
}
```

To learn more about Vite plugins, please visit their [plugin guide](https://vitejs.dev/guide/using-plugins.html).



## Custom Renderers

In Astro v0.21, plugins previously using `snowpackPlugin` or `snowpackPluginOptions` should now use `viteConfig()`.

```diff
// @astrojs/renderer-svelte/index.js
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



[Snowpack]: https://www.snowpack.dev
[Vite]: https://vitejs.dev
