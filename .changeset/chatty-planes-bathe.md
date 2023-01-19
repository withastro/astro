---
'@astrojs/svelte': major
'astro': minor
---

Users are required to setup Svelte preprocessing with `svelte.config.js` themselves for IDE autocompletion compatibility. The `astro add svelte` command now supports setting this up by default.

To migrate, make sure you're using the latest version of `astro` and `@astrojs/svelte`, and create a new `svelte.config.js` file with:

```js
import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: [vitePreprocess()],
}
```
