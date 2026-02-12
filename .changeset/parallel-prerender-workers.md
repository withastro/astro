---
'astro': major
---

Enable parallel static generation with worker-based prerendering and default `build.concurrency` to `"auto"`.

If you need to tune this, set an explicit value in `astro.config`:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
	build: {
		concurrency: 1,
	},
});
```
