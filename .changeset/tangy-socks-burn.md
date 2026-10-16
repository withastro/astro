---
'astro': minor
---

Adds an experimental `experimental.dynamicComponents` flag and the `astro:dynamic` module to render a component chosen at runtime with only its own styles and scripts.

When composing pages from data, such as when building pages from CMS "page builder" blocks, a page often imports every possible component and selects which one to render. Astro adds the styles and scripts of every imported component to the page, including the ones that never render. Import the candidate components with the `?assets` query through `dynamic()` so their assets are added only when they render.

```astro
---
import { dynamic } from 'astro:dynamic';

const loaders = {
  hero: () => import('../components/Hero.astro?assets'),
  cards: () => import('../components/Cards.astro?assets'),
};

const Render = await dynamic(loaders[view.component]);
---

<Render {...view.props} />
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    dynamicComponents: true,
  },
});
```

This works for prerendered and on-demand rendered pages, and adds the styles through head propagation so streaming is preserved.
