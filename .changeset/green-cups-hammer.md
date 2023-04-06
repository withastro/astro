---
'astro': minor
---

Implements a new class-based scoping strategy

This implements the [Scoping RFC](https://github.com/withastro/roadmap/pull/543), providing a way to opt-in to increased style specifity for Astro component styles.

This prevents bugs where global styles override Astro component styles due to CSS ordering and the use of element selectors.

To enable class-based scoping you can set it in your config:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  scopedStyleStrategy: 'class'
});
```

Note that the 0-specifity `:where` pseudo-selector is still used as the default strategy. The intent is to change `'class'` to be the default in 3.0.
