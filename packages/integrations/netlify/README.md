# @astrojs/netlify

This adapter allows Astro to deploy your [`hybrid` or `server` rendered site](https://docs.astro.build/en/core-concepts/rendering-modes/#on-demand-rendered) to [Netlify](https://www.netlify.com/).

Learn how to deploy your Astro site in our [Netlify deployment guide](https://docs.astro.build/en/guides/deploy/netlify/).

- <strong>[Why Astro Netlify](#why-astro-netlify)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Netlify

If you're using Astro as a static site builder—its behavior out of the box—you don't need an adapter.

If you wish to [use on-demand rendering, also known as server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Netlify](https://www.netlify.com/) is a deployment platform that allows you to host your site by connecting directly to your GitHub repository. This adapter enhances the Astro build process to prepare your project for deployment through Netlify.

## Installation

Add the Netlify adapter with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

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

   ```diff lang="js"
     // astro.config.mjs
     import { defineConfig } from 'astro/config';
   + import netlify from '@astrojs/netlify';

     export default defineConfig({
   +   output: 'server',
   +   adapter: netlify(),
     });
   ```

## Usage

[Read the full deployment guide here.](https://docs.astro.build/en/guides/deploy/netlify/)

Follow the instructions to [build your site locally](https://docs.astro.build/en/guides/deploy/#building-your-site-locally). After building, you will have a `.netlify/` folder containing both [Netlify Functions](https://docs.netlify.com/functions/overview/) in the `.netlify/functions-internal/` folder and [Netlify Edge Functions](https://docs.netlify.com/edge-functions/overview/) in the`.netlify/edge-functions/` folder.

To deploy your site, install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and run:

```sh
netlify deploy
```

The [Netlify Blog post on Astro](https://www.netlify.com/blog/how-to-deploy-astro/) and the [Netlify Docs](https://docs.netlify.com/integrations/frameworks/astro/) provide more information on how to use this integration to deploy to Netlify.

### Accessing edge context from your site

Netlify Edge Functions provide a [context object](https://docs.netlify.com/edge-functions/api/#netlify-specific-context-object) that includes metadata about the request such as a user’s IP, geolocation data, and cookies.

This can be accessed through the `Astro.locals.netlify.context` object:

```astro
---
const {
  geo: { city },
} = Astro.locals.netlify.context;
---

<h1>Hello there, friendly visitor from {city}!</h1>
```

If you're using TypeScript, you can get proper typings by updating `src/env.d.ts` to use `NetlifyLocals`:

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type NetlifyLocals = import('@astrojs/netlify').NetlifyLocals

declare namespace App {
  interface Locals extends NetlifyLocals {
    ...
  }
}
```

This is not available on prerendered pages.

### Running Astro middleware in Edge Functions

Any Astro middleware is applied to pre-rendered pages at build-time, and to on-demand-rendered pages at runtime.

To implement redirects, access control or custom response headers for pre-rendered pages, run your middleware on Netlify Edge Functions by enabling the `edgeMiddleware` option:

```diff lang="js"
// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  output: 'server',
  adapter: netlify({
+   edgeMiddleware: true,
  }),
});
```

Configuring `edgeMiddleware: true` will deploy your middleware as an Edge Function, and run it on all routes - including pre-rendered pages. However, locals specified in the middleware won't be available to any pre-rendered pages, because they've already been fully-rendered at build-time.

### Netlify Image CDN support

This adapter uses the [Netlify Image CDN](https://docs.netlify.com/image-cdn/) to transform images on-the-fly without impacting build times.
It's implemented using an [Astro Image Service](https://docs.astro.build/en/reference/image-service-reference/) under the hood.

> **Note**
> This adapter does not support the `image.domains` and `image.remotePatterns` config properties in your Astro config. To [specify remote paths for Netlify Image CDN](https://docs.netlify.com/image-cdn/overview/#remote-path), use the `remote_images` field in `netlify.toml`.

### Static sites & Redirects

For static sites you usually don't need an adapter. However, if you use `redirects` configuration in your Astro config, the Netlify adapter can be used to translate this to the proper `_redirects` format.

```js
// astro.config.mjs
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

### Caching Pages

On-demand rendered pages without any dynamic content can be cached to improve performance and lower resource usage.
Enabling the `cacheOnDemandPages` option in the adapter will cache all server-rendered pages for up to one year:

```ts
// astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: netlify({
    cacheOnDemandPages: true,
  }),
});
```

This can be changed on a per-page basis by adding caching headers to your response:

```astro
---
// src/pages/index.astro
import Layout from '../components/Layout.astro';

Astro.response.headers.set('CDN-Cache-Control', 'public, max-age=45, must-revalidate');
---

<Layout title="Astro on Netlify">
  {new Date()}
</Layout>
```

With [fine-grained cache control](https://www.netlify.com/blog/swr-and-fine-grained-cache-control/), Netlify supports
standard caching headers like `CDN-Cache-Control` or `Vary`.
Refer to the docs to learn about implementing e.g. time to live (TTL) or stale while revalidate (SWR) caching: https://docs.netlify.com/platform/caching

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
