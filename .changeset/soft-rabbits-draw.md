---
"astro": patch
---

**BREAKING CHANGE to the experimental Container API only**

Changes the default page rendering behavior of Astro components in containers, and adds a new option `partial: false` to render full Astro pages as before.

Previously, the Container API was rendering all Astro components as if they were full Astro pages containing `<!DOCTYPE html>` by default. This was not intended, and now by default, all components will render as [page partials](https://docs.astro.build/en/basics/astro-pages/#page-partials): only the contents of the components without a page shell.

To render the component as a full-fledged Astro page, pass a new option called `partial: false` to `renderToString()` and `renderToResponse()`:

```js
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Card from "../src/components/Card.astro";

const container = AstroContainer.create();

await container.renderToString(Card); // the string will not contain `<!DOCTYPE html>`
await container.renderToString(Card, { partial: false }); // the string will contain `<!DOCTYPE html>`
```

