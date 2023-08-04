---
'astro': major
---

Implements a new scope style strategy called `"attribute"`. When enabled, styles are applied using `data-*` attributes.

The **default** value of `scopedStyleStrategy` is `"attribute"`.

If you want to use the previous behaviour, you have to use the `"where"` option:

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
+    scopedStyleStrategy: 'where',
});
```
