---
'astro': minor
---

Implements a new scope style strategy called `attribute`. When enabled, styles are applied using `data-*` attributes.

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
    scopedStyleStrategy: 'attribute',
});
```
