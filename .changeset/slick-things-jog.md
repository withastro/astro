---
'@astrojs/react': minor
---

Adds a new configuration option `reactCompilerEnabled` to allow you to optimize your React components automatically.

The React Compiler handles memoization for you, eliminating the need for the manual use of `useMemo`, `useCallback` and `React.memo`.

To get started, install `babel-plugin-react-compiler` using your preferred package manager and enable the option:

```diff
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({
  integrations: [react({
+    reactCompilerEnabled: true,
  })]
});
```