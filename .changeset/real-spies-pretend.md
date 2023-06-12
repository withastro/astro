---
'@astrojs/tailwind': major
---

Let tailwind postcss plugin load its config file itself. This changes the `tailwind.config.js` loading behaviour where Tailwind would load the config file from `process.cwd()` instead of the project `root`. You can configure the integration's `config.path` option to load from a specific path instead.

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'url';

export default defineConfig({
	integrations: [
		tailwind({
			config: {
				path: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)),
			},
		}),
	],
});
```
