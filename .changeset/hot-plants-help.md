---
'astro': patch
---

Adds support for the Node adapter (SSR)

This provides the first SSR adapter available using the `integrations` API. It is a Node.js adapter that can be used with the `http` module or any framework that wraps it, like Express.

In your astro.config.mjs use:

```js
import nodejs from '@astrojs/node';

export default {
  adapter: nodejs()
}
```

After performing a build there will be a `dist/server/entry.mjs` module that works like a middleware function. You can use with any framework that supports the Node `request` and `response` objects. For example, with Express you can do:

```js
import express from 'express';
import { handler as ssrHandler } from '@astrojs/node';

const app = express();
app.use(handler);

app.listen(8080);
```
