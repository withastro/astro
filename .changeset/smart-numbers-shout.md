---
'astro': patch
---

Astro is smarter about CSS! Small stylesheets are now inlined by default, and no longer incur the cost of additional requests to your server. Your visitors will have to wait less before they see your pages, especially those in remote locations or in a subway.

This may not be news to you if you had opted-in via the `build.inlineStylesheets` configuration. Stabilized in Astro 2.6 and set to "auto" by default for Starlight, this configuration allows you to reduce the number of requests for stylesheets by inlining them into <style> tags. The new default is "auto", which selects assets smaller than 4kB and includes them in the initial response.

To go back to the previous default behavior, change `build.inlineStylesheets` to "never".

```ts
import { defineConfig } from 'astro/config';

export default defineConfig({
	build: {
		inlineStylesheets: 'never',
	},
});
```
