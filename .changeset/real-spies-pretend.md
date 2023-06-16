---
'@astrojs/tailwind': major
---

Let the `tailwindcss` PostCSS plugin load its config file itself. This changes the Tailwind config loading behaviour where it is loaded from `process.cwd()` instead of the project `root`.

If your Tailwind config file is not located in the current working directory, you will need to configure the integration's `configFile` option to load from a specific path:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'url';

export default defineConfig({
	integrations: [
		tailwind({
			configFile: fileURLToPath(new URL('./tailwind.config.cjs', import.meta.url)),
		}),
	],
});
```

This change also requires a Tailwind config file to exist in your project as a fallback config is no longer provided. It is set up automatically during `astro add tailwind`, but if it does not exist, you can manually create a `tailwind.config.cjs` file in your project root:

```js
// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [],
}
```
