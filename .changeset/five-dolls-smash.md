---
'@astrojs/svelte': major
---

Adds support for Svelte 5. Svelte 3 and 4 are no longer supported.

The integration will now also no longer add `vitePreprocess()` by default if a preprocessor is not set up in `svelte.config.js`. It is recommended to set up the Svelte config manually so that features like IDE completion and syntax highlighting work properly.

If you're using SCSS, Stylus, etc in your Svelte component style tags, make sure that the preprocessor is also set up in `svelte.config.js`. For example:

```js
// svelte.config.js
import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: vitePreprocess(),
};
```

Refer to the [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) and [`@sveltejs/vite-plugin-svelte` changelog](https://github.com/sveltejs/vite-plugin-svelte/blob/main/packages/vite-plugin-svelte/CHANGELOG.md#400) for details of their respective breaking changes.
