---
'astro': minor
---

Adds an experimental `astro()` Vite plugin, exported from `astro/vite`, for running Astro inside a standard Vite project without the Astro CLI or an `astro.config.mjs` file

The Astro config, including integrations, is passed inline. `vite`, `vite build`, and `vite preview` then run the dev server, build, and preview.

```ts
// vite.config.ts
import react from '@astrojs/react';
import { astro } from 'astro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [astro({ integrations: [react()] })],
});
```
