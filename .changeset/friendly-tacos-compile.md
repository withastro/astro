---
'@astrojs/react': minor
---

Adds an opt-in `compiler` option for the Oxc-based React Compiler while preserving the existing `babel` option and React plugin behavior.

Install `oxc-transform-react` and enable it in your Astro config:

```js
import react from '@astrojs/react';

export default {
  integrations: [react({ compiler: true })],
};
```

The compiler memoizes client components and hooks. Server rendering is not compiled. The target defaults to the installed React major version; React 17 and 18 projects also need `react-compiler-runtime` installed. Pass an options object to configure the compiler, for example `compiler: { compilationMode: 'annotation' }`. The integration's `include` and `exclude` options apply to compilation; dependencies and Astro files are excluded from the Oxc transform.

Existing Babel plugins continue to run. Do not enable the Babel React Compiler and Oxc React Compiler on the same client components; explicitly configuring both compilers produces an error.
