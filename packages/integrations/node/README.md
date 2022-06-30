# @astrojs/node 🔲

This adapter allows Astro to deploy your SSR site to Node targets.

- <strong>[Why Astro Node](#why-astro-node)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong> 


## Why Astro Node

If you're using Astro as a static site builder—its behavior out of the box—you don't need an adapter.

If you wish to [use server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Node](https://nodejs.org/en/) is a JavaScript runtime for server-side code. Frameworks like [Express](https://expressjs.com/) are built on top of it and make it easier to write server applications in Node. This adapter provides access to Node's API and creates a script to run your Astro project that can be utilized in Node applications.

## Installation

First, install the `@astrojs/node` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/node
```

Then, install this adapter in your `astro.config.*` file using the `adapter` property:

__astro.config.mjs__

```js
import { defineConfig } from 'astro/config';
import deno from '@astrojs/node';

export default defineConfig({
  // ...
  adapter: node()
})
```

## Usage

After [performing a build](https://docs.astro.build/en/guides/deploy/#building-the-app) there will be a `dist/server/entry.mjs` module that exposes a `handler` function. This works like a [middleware](https://expressjs.com/en/guide/using-middleware.html) function: it can handle incoming requests and respond accordingly. 


### Using a middleware framework
You can use this `handler` with any framework that supports the Node `request` and `response` objects.

For example, with Express:

```js
import express from 'express';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = express();
app.use(ssrHandler);

app.listen(8080);
```


### Using `http`

This output script does not require you use Express and can work with even the built-in `http` and `https` node modules. The handler does follow the convention calling an error function when either

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



## Configuration

This adapter does not expose any configuration options.

## Examples

## Troubleshooting

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
