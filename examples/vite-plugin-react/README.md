# Astro as a Vite plugin (spike)

No `astro.config.mjs` and no Astro CLI. Astro is configured inline in `vite.config.ts`:

```ts
import react from '@astrojs/react/vite';
import { astro } from 'astro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [astro({ renderers: [react()] })],
});
```

- `pnpm dev` → `vite`
- `pnpm build` → `vite build`
- `pnpm preview` → `vite preview`
