---
'@astrojs/db': minor
---

Removes the `AstroDbIntegration` type

Astro integration hooks can now be extended and as such `@astrojs/db` no longer needs to declare it's own integration type. Using `AstroIntegration` will have the same type.

If you were using the `AstroDbIntegration` type, apply this change to your integration code:

```diff
- import { defineDbIntegration, type AstroDbIntegration } from '@astrojs/db/utils';
+ import { defineDbIntegration } from '@astrojs/db/utils';
import type { AstroIntegration } from 'astro';

- export default (): AstroDbIntegration => {
+ export default (): AstroIntegration => {
  return defineDbIntegration({
    name: 'your-integration',
    hooks: {},
  });
}
```
