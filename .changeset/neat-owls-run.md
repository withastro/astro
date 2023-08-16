---
'astro': major
---

Remove exports for `astro/internal/*` and `astro/runtime/server/*` in favour of `astro/runtime/*`. Add new `astro/compiler-runtime` export for compiler-specific runtime code.

These are exports for Astro's internal API and should not affect your project, but if you do use these entrypoints, you can migrate like below:

```diff
- import 'astro/internal/index.js';
+ import 'astro/runtime/server/index.js';

- import 'astro/server/index.js';
+ import 'astro/runtime/server/index.js';
```

```diff
import { transform } from '@astrojs/compiler';

const result = await transform(source, {
- internalURL: 'astro/runtime/server/index.js',
+ internalURL: 'astro/compiler-runtime',
  // ...
});
```
