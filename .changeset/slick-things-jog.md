---
'@astrojs/react': minor
---

Adds a configuration option `reactCompilerEnabled` to allow you to automatically optimize your React components. React Compiler handles memoization for you, eliminating the need for the manual use of `useMemo`, `useCallback` and `React.memo`.

```typescript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';


export default defineConfig({
  integrations: [react({
    reactCompilerEnabled: true,
  })]
});
```