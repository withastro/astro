# @astrojs/node

An experimental server-side rendering adapter for use with Node.js servers.

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
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = express();
app.use(ssrHandler);

app.listen(8080);
```

# Using `http`

This adapter does not require you use Express and can work with even the `http` and `https` modules. The adapter does following the Expression convention of calling a function when either

- A route is not found for the request.
- There was an error rendering.

You can use these to implement your own 404 behavior like so:

```js
import http from 'http';
import { handler as ssrHandler } from './dist/server/entry.mjs';

http.createServer(function(req, res) {
  ssrHandler(req, res, err => {
    if(err) {
      res.writeHead(500);
      res.end(err.toString());
    } else {
      // Serve your static assets here maybe?
      // 404?
      res.writeHead(404);
      res.end();
    }
  });
}).listen(8080);
```
