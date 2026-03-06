---
'astro': minor
---

Exports new `createRequest()` and `writeResponse()` utilities from `astro/app/node`

To replace the deprecated `NodeApp.createRequest()` and `NodeApp.writeResponse()` methods, the `astro/app/node` module now exposes new `createRequest()` and `writeResponse()` utilities. These can be used to convert a NodeJS `IncomingMessage` into a web-standard `Request` and stream a web-standard `Response` into a NodeJS `ServerResponse`:

```js
import { createApp } from 'astro/app/entrypoint';
import { createRequest, writeResponse } from 'astro/app/node';
import { createServer } from 'node:http';

const app = createApp();

const server = createServer(async (req, res) => {
    const request = createRequest(req);
    const response = await app.render(request);
    await writeResponse(response, res);
})
```