---
'astro': patch
---

Add `<Debug>` component for JavaScript-free client-side debugging.

```astro
---
import Debug from 'astro/debug';
const obj = { /* ... */ }
---

<Debug {obj} />
```
