---
"astro": patch
---

Fixes an internal error that prevented the `AstroContainer` to render the `Content` component.

You can now write code similar to the following to render content collections:

```js
const entry = await getEntry(collection, slug);
const { Content } = await entry.render();
const content = await container.renderToString(Content);
```
