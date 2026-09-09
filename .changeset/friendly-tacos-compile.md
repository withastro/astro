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
