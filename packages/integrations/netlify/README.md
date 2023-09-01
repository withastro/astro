# @astrojs/netlify

This adapter allows Astro to deploy your SSR site to [Netlify](https://www.netlify.com/).

Learn how to deploy your Astro site in our [Netlify deployment guide](https://docs.astro.build/en/guides/deploy/netlify/).

- <strong>[Why Astro Netlify](#why-astro-netlify)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Netlify

If you're using Astro as a static site builder—its behavior out of the box—you don't need an adapter.

If you wish to [use server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Netlify](https://www.netlify.com/) is a deployment platform that allows you to host your site by connecting directly to your GitHub repository. This adapter enhances the Astro build process to prepare your project for deployment through Netlify.

## Installation

Add the Netlify adapter to enable SSR in your Astro project with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

```sh
# Using NPM
npx astro add netlify
# Using Yarn
yarn astro add netlify
# Using PNPM
pnpm astro add netlify
```

### Add dependencies manually

If you prefer to install the adapter manually instead, complete the following two steps:

1. Install the Netlify adapter to your project’s dependencies using your preferred package manager. If you’re using npm or aren’t sure, run this in the terminal:

   ```bash
     npm install @astrojs/netlify
   ```

1. Add two new lines to your `astro.config.mjs` project configuration file.

   ```js ins={3, 6-7}
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   import netlify from '@astrojs/netlify/functions';

   export default defineConfig({
     output: 'server',
     adapter: netlify(),
   });
   ```

### Run middleware in Edge Functions

When deploying to Netlify Functions, you can choose to use an Edge Function to run your Astro middleware.

To enable this, set the `edgeMiddleware` config option to `true`:

```js ins={9}
// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true,
  }),
});
```

#### Pass edge context to your site

Netlify Edge Functions provide a [context object](https://docs.netlify.com/edge-functions/api/#netlify-specific-context-object) including metadata about the request, such as a user’s IP, geolocation data, and cookies.

To expose values from this context to your site, create a `netlify-edge-middleware.ts` (or `.js`) file in your project’s [source directory](https://docs.astro.build/en/reference/configuration-reference/#srcdir). This file must export a function that returns the data to add to [Astro’s `locals` object](https://docs.astro.build/en/guides/middleware/#locals), which is available in middleware and Astro routes.

In this example, `visitorCountry` and `hasEdgeMiddleware` would both be added to Astro’s `locals` object:

```ts
// src/netlify-edge-middleware.ts
import type { Context } from 'https://edge.netlify.com';

export default function ({ request, context }: { request: Request; context: Context }) {
  // Return serializable data to add to Astro.locals
  return {
    visitorCountry: context.geo.country.name,
    hasEdgeMiddleware: true,
  };
}
```

> **Note**
> Netlify Edge Functions run in [a Deno environment](https://docs.netlify.com/edge-functions/api/#runtime-environment), so import statements in this file must use Deno’s URL syntax.

`netlify-edge-middleware.ts` must provide a function as its default export. This function:

- must return a JSON-serializable object, which cannot include types like `Map`, `function`, `Set`, etc.
- will always run first, before any other middleware and routes.
- cannot return a response or redirect.

### Per-page functions

The Netlify adapter builds to a single function by default. Astro 2.7 added support for splitting your build into separate entry points per page. If you use this configuration, the Netlify adapter will generate a separate function for each page. This can help reduce the size of each function so they are only bundling code used on that page.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    functionPerRoute: true,
  }),
});
```

### Static sites

For static sites you usually don't need an adapter. However, if you use `redirects` configuration in your Astro config, the Netlify adapter can be used to translate this to the proper `_redirects` format.

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/static';

export default defineConfig({
  adapter: netlify(),

  redirects: {
    '/blog/old-post': '/blog/new-post',
  },
});
```

Once you run `astro build` there will be a `dist/_redirects` file. Netlify will use that to properly route pages in production.

> **Note**
> You can still include a `public/_redirects` file for manual redirects. Any redirects you specify in the redirects config are appended to the end of your own.

### On-demand Builders

[Netlify On-demand Builders](https://docs.netlify.com/configure-builds/on-demand-builders/) are serverless functions used to generate web content as needed that’s automatically cached on Netlify’s Edge CDN. You can enable these functions using the [`builders` configuration](#builders).

By default, all pages will be rendered on first visit and the rendered result will be reused for every subsequent visit until you redeploy. To set a revalidation time, call the [`runtime.setBuildersTtl(ttl)` local](https://docs.astro.build/en/guides/middleware/#locals) with the duration (in seconds).

The following example sets a revalidation time of 45, causing Netlify to store the rendered HTML for 45 seconds.

```astro
---
import Layout from '../components/Layout.astro';

if (import.meta.env.PROD) {
  Astro.locals.runtime.setBuildersTtl(45);
}
---

<Layout title="Astro on Netlify">
  {new Date(Date.now())}
</Layout>
```

It is important to note that On-demand Builders ignore query params when checking for cached pages. For example, if `example.com/?x=y` is cached, it will be served for `example.com/?a=b` (different query params) and `example.com/` (no query params) as well.

## Usage

[Read the full deployment guide here.](https://docs.astro.build/en/guides/deploy/netlify/)

After [performing a build](https://docs.astro.build/en/guides/deploy/#building-your-site-locally) the `netlify/` folder will contain [Netlify Functions](https://docs.netlify.com/functions/overview/) in the `netlify/functions/` folder.

Now you can deploy. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and run:

```sh
netlify deploy --build
```

The [Netlify Blog post on Astro](https://www.netlify.com/blog/how-to-deploy-astro/) and the [Netlify Documentation](https://docs.netlify.com/integrations/frameworks/astro/) provide more information on how to use this integration to deploy to Netlify.

## Configuration

To configure this adapter, pass an object to the `netlify()` function call in `astro.config.mjs` - there's only one possible configuration option:

### dist

We build to the `dist` directory at the base of your project. To change this, use the `dist` option:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    dist: new URL('./dist/', import.meta.url),
  }),
});
```

And then point to the dist in your `netlify.toml`:

```toml title="netlify.toml"
[functions]
directory = "dist/functions"
```

### builders

You can enable On-demand Builders using the `builders` option:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    builders: true,
  }),
});
```

On-demand Builders are only available with the `@astrojs/netlify/functions` adapter and are not compatible with Edge Functions.

### binaryMediaTypes

> This option is only needed for the Functions adapter and is not needed for Edge Functions.

Netlify Functions requires binary data in the `body` to be base64 encoded. The `@astrojs/netlify/functions` adapter handles this automatically based on the `Content-Type` header.

We check for common mime types for audio, image, and video files. To include specific mime types that should be treated as binary data, include the `binaryMediaTypes` option with a list of binary mime types.

```js {12}
// src/pages/image.jpg.ts

import fs from 'node:fs';

export function GET() {
  const buffer = fs.readFileSync('../image.jpg');

  // Return the buffer directly, @astrojs/netlify will base64 encode the body
  return new Response(buffer, {
    status: 200,
    headers: {
      'content-type': 'image/jpeg',
    },
  });
}
```

## Examples

- The [Astro Netlify Edge Starter](https://github.com/sarahetter/astro-netlify-edge-starter) provides an example and a guide in the README.

- [Browse Astro Netlify projects on GitHub](https://github.com/search?q=path%3A**%2Fastro.config.mjs+%40astrojs%2Fnetlify&type=code) for more examples!

## Troubleshooting

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
