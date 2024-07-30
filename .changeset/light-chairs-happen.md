---
'@astrojs/react': patch
'astro': patch
---

**BREAKING CHANGE to the experimental Actions API only**

Make `.safe()` the default return value for actions. This means `{ data, error }` will be returned when calling an action directly. If you prefer to get the data while allowing errors to throw, chain the `.orThrow()` modifier.

```ts
import { actions } from 'astro:actions';

// Before
const { data, error } = await actions.like.safe();
// After
const { data, error } = await actions.like();

// Before
const newLikes = await actions.like();
// After
const newLikes = await actions.like.orThrow();
```

## Migration

To migrate your existing action calls:

- Remove `.safe` from existing _safe_ action calls
- Add `.orThrow` to existing _unsafe_ action calls
