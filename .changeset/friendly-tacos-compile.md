---
'@astrojs/react': major
---

Migrates the React integration to `@vitejs/plugin-react` v6, using Oxc for JSX and Fast Refresh. Removes the `babel` integration option; projects with custom Babel transforms must configure `@rolldown/plugin-babel` under `vite.plugins` instead.

Adds an opt-in `compiler` option for the Oxc-based React Compiler. Install `oxc-transform-react` and enable it in your Astro config:

```js
import react from '@astrojs/react';

export default {
  integrations: [react({ compiler: true })],
};
```

The compiler memoizes client components and hooks. Server rendering is not compiled. The target defaults to the installed React major version; React 17 and 18 projects also need `react-compiler-runtime` installed. Pass an options object to configure the compiler, for example `compiler: { compilationMode: 'annotation' }`. The integration's `include` and `exclude` options apply, and dependencies and Astro files are excluded.

## Migrating custom Babel transforms

The integration uses `@vitejs/plugin-react` v6 and Oxc for JSX and Fast Refresh. The `babel` integration option has been removed in this major release.

If you use custom Babel transforms, install `@rolldown/plugin-babel` and `@babel/core`, keeping your existing Babel plugins and presets installed:

```sh
pnpm add -D @rolldown/plugin-babel @babel/core
```

Move your Babel plugins and presets from `react({ babel: ... })` to `babel()` in `vite.plugins`. For example, migrate a project using `babel-plugin-styled-components` from:

```js
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react({ babel: { plugins: ['babel-plugin-styled-components'] } })],
});
```

To:

```js
import react from '@astrojs/react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [
      babel({
        plugins: ['babel-plugin-styled-components'],
      }),
    ],
  },
});
```

This also works with `react({ compiler: true })`. Babel runs before Oxc transforms TypeScript and JSX. The Babel plugin automatically enables parsing for `.jsx`, `.ts`, and `.tsx` files. It does not load `babel.config.js` or `.babelrc` files; pass the options directly to `babel()`. The old `babel` callback is not supported; use the plugin's [`overrides` and preset hooks](https://github.com/rolldown/plugins/tree/main/packages/babel#options) for conditional transforms.

Do not enable `babel-plugin-react-compiler` on the same components as the Oxc compiler.
