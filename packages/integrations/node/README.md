# @astrojs/node

This adapter allows Astro to deploy your SSR site to Node targets.

- <strong>[Why Astro Node](#why-astro-node)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why @astrojs/node

If you're using Astro as a static site builder—its behavior out of the box—you don't need an adapter.

If you wish to [use server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Node.js](https://nodejs.org/en/) is a JavaScript runtime for server-side code. @astrojs/node can be used either in standalone mode or as middleware for other http servers, such as [Express](https://expressjs.com/).

## Installation

Add the Node adapter to enable SSR in your Astro project with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

```sh
# Using NPM
npx astro add node
# Using Yarn
yarn astro add node
# Using PNPM
pnpm astro add node
```

If you prefer to install the adapter manually instead, complete the following two steps:

1. Install the Node adapter to your project’s dependencies using your preferred package manager. If you’re using npm or aren’t sure, run this in the terminal:

   ```bash
     npm install @astrojs/node
   ```

1. Add two new lines to your `astro.config.mjs` project configuration file.

   ```js ins={3, 6-9}
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   import node from '@astrojs/node';

   export default defineConfig({
     output: 'server',
     adapter: node({
       mode: 'standalone',
     }),
   });
   ```

## Configuration

@astrojs/node can be configured by passing options into the adapter function. The following options are available:

### Mode

Controls whether the adapter builds to `middleware` or `standalone` mode.

- `middleware` mode allows the built output to be used as middleware for another Node.js server, like Express.js or Fastify.

  ```js
  import { defineConfig } from 'astro/config';
  import node from '@astrojs/node';

  export default defineConfig({
    output: 'server',
    adapter: node({
      mode: 'middleware',
    }),
  });
  ```

- `standalone` mode builds to server that automatically starts with the entry module is run. This allows you to more easily deploy your build to a host without any additional code.

## Usage

First, [performing a build](https://docs.astro.build/en/guides/deploy/#building-your-site-locally). Depending on which `mode` selected (see above) follow the appropriate steps below:

### Middleware

The server entrypoint is built to `./dist/server/entry.mjs` by default. This module exports a `handler` function that can be used with any framework that supports the Node `request` and `response` objects.

For example, with Express:

```js
import express from 'express';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = express();
// Change this based on your astro.config.mjs, `base` option.
// They should match. The default value is "/".
const base = '/';
app.use(base, express.static('dist/client/'));
app.use(ssrHandler);

app.listen(8080);
```

Or, with Fastify (>4):

```js
import Fastify from 'fastify';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = Fastify({ logger: true });

await app
  .register(fastifyStatic, {
    root: fileURLToPath(new URL('./dist/client', import.meta.url)),
  })
  .register(fastifyMiddie);
app.use(ssrHandler);

app.listen({ port: 8080 });
```

Additionally, you can also pass in an object to be accessed with `Astro.locals` or in Astro middleware:

```js
import express from 'express';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = express();
app.use(express.static('dist/client/'))
app.use((req, res, next) => {
  const locals = {
    title: 'New title'
  };

  ssrHandler(req, res, next, locals);
);

app.listen(8080);
```

Note that middleware mode does not do file serving. You'll need to configure your HTTP framework to do that for you. By default the client assets are written to `./dist/client/`.

### Standalone

In standalone mode a server starts when the server entrypoint is run. By default it is built to `./dist/server/entry.mjs`. You can run it with:

```shell
node ./dist/server/entry.mjs
```

For standalone mode the server handles file servering in addition to the page and API routes.

#### Custom host and port

You can override the host and port the standalone server runs on by passing them as environment variables at runtime:

```shell
HOST=0.0.0.0 PORT=3000 node ./dist/server/entry.mjs
```

#### HTTPS

By default the standalone server uses HTTP. This works well if you have a proxy server in front of it that does HTTPS. If you need the standalone server to run HTTPS itself you need to provide your SSL key and certificate.

You can pass the path to your key and certification via the environment variables `SERVER_CERT_PATH` and `SERVER_KEY_PATH`. This is how you might pass them in bash:

```bash
SERVER_KEY_PATH=./private/key.pem SERVER_CERT_PATH=./private/cert.pem node ./dist/server/entry.mjs
```

## Troubleshooting

### SyntaxError: Named export 'compile' not found

You may see this when running the entry script if it was built with npm or Yarn. This is a [known issue](https://github.com/withastro/astro/issues/4974) that will be fixed in a future release. As a workaround, add `"path-to-regexp"` to the `noExternal` array:

```js ins={9-13}
// astro.config.mjs
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node(),
  vite: {
    ssr: {
      noExternal: ['path-to-regexp'],
    },
  },
});
```

For more help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
