---
"astro": patch
---

You can now pass `props` when rendering a component using the Container APIs:

```js
import { experimental_AstroContainer as AstroContainer } from "astro/contaienr";
import Card from "../src/components/Card.astro";

const container = await AstroContainer.create();
const result = await container.renderToString(Card, {
  props: {
    someState: true
  }
});
```
