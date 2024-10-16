---
"astro": patch
---

**BREAKING CHANGE to the experimental Container API only**

Until now, the Container API was rendering the components as they were full-fledged Astro pages.

Full-fledged Astro pages contain `<!DOCTYPE html>` but default. This was not intended, and this patch fixes the behavior. 

It's still possible to render the component as a full-fledged Astro page by passing a **new option** called `partial: false` to `renderToString` and `renderToResponse`:

```js
import { experimental_AstroContainer as AstroContainer } from 'astro/containerl';
import Card from "../src/components/Card.astro";

const container = AstroContainer.create();

await container.renderToString(Card); // the string will not contain `<!DOCTYPE html>`
await container.renderToString(Card, { partial: false }); // the string will contain `<!DOCTYPE html>`
```

