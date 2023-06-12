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

This change also requires a Tailwind config file to exist in your project as Astro's fallback value is no longer provided. It is set up automatically during `astro add tailwind`, but you can also manually create a `tailwind.config.cjs` file in your project root:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [],
}
```
