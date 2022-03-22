# @astrojs/node

An experimental static-side rendering adapter for use with Node.js servers.

In your astro.config.mjs use:

```js
import nodejs from '@astrojs/node';

export default {
  integrations: [nodejs()]
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
