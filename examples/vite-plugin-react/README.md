# Astro as a Vite plugin (spike)

No `astro.config.mjs` and no Astro CLI. The Astro config, including integrations, is passed inline in `vite.config.ts`:

```ts
import react from '@astrojs/react';
import { astro } from 'astro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [astro({ integrations: [react()] })],
});
```

- `pnpm dev` → `vite`
- `pnpm build` → `vite build`
- `pnpm preview` → `vite preview`
