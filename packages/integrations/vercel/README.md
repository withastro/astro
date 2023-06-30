# @astrojs/vercel

This adapter allows Astro to deploy your SSR site to [Vercel](https://www.vercel.com/).

Learn how to deploy your Astro site in our [Vercel deployment guide](https://docs.astro.build/en/guides/deploy/vercel/).

- <strong>[Why Astro Vercel](#why-astro-vercel)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Vercel

If you're using Astro as a static site builder — its behavior out of the box — you don't need an adapter.

If you wish to [use server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Vercel](https://www.vercel.com/) is a deployment platform that allows you to host your site by connecting directly to your GitHub repository. This adapter enhances the Astro build process to prepare your project for deployment through Vercel.

## Installation

Add the Vercel adapter to enable SSR in your Astro project with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

```sh
# Using NPM
npx astro add vercel
# Using Yarn
yarn astro add vercel
# Using PNPM
pnpm astro add vercel
```

If you prefer to install the adapter manually instead, complete the following two steps:

1. Install the Vercel adapter to your project’s dependencies using your preferred package manager. If you’re using npm or aren’t sure, run this in the terminal:

   ```bash
     npm install @astrojs/vercel
   ```

1. Add two new lines to your `astro.config.mjs` project configuration file.

   ```js ins={3, 6-7}
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   import vercel from '@astrojs/vercel/serverless';

   export default defineConfig({
     output: 'server',
     adapter: vercel(),
   });
   ```

### Targets

You can deploy to different targets:

- `edge`: SSR inside an [Edge function](https://vercel.com/docs/concepts/functions/edge-functions).
- `serverless`: SSR inside a [Node.js function](https://vercel.com/docs/concepts/functions/serverless-functions).
- `static`: generates a static website following Vercel's output formats, redirects, etc.

> **Note**: deploying to the Edge has [its limitations](https://vercel.com/docs/concepts/functions/edge-functions#known-limitations). An edge function can't be more than 1 MB in size and they don't support native Node.js APIs, among others.

You can change where to target by changing the import:

```js
import vercel from '@astrojs/vercel/edge';
import vercel from '@astrojs/vercel/serverless';
import vercel from '@astrojs/vercel/static';
```

## Usage

📚 **[Read the full deployment guide here.](https://docs.astro.build/en/guides/deploy/vercel/)**

You can deploy by CLI (`vercel deploy`) or by connecting your new repo in the [Vercel Dashboard](https://vercel.com/). Alternatively, you can create a production build locally:

```sh
astro build
vercel deploy --prebuilt
```

## Configuration

To configure this adapter, pass an object to the `vercel()` function call in `astro.config.mjs`:

### analytics

**Type:** `boolean`<br>
**Available for:** Serverless, Edge, Static<br>
**Added in:** `@astrojs/vercel@3.1.0`

You can enable [Vercel Analytics](https://vercel.com/analytics) (including Web Vitals and Audiences) by setting `analytics: true`. This will inject Vercel’s tracking scripts into all your pages.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    analytics: true,
  }),
});
```

### imagesConfig

**Type:** `VercelImageConfig`<br>
**Available for:** Edge, Serverless, Static
**Added in:** `@astrojs/vercel@3.3.0`

Configuration options for [Vercel's Image Optimization API](https://vercel.com/docs/concepts/image-optimization). See [Vercel's image configuration documentation](https://vercel.com/docs/build-output-api/v3/configuration#images) for a complete list of supported parameters.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    imagesConfig: {
      sizes: [320, 640, 1280],
    },
  }),
});
```

### imageService

**Type:** `boolean`<br>
**Available for:** Edge, Serverless, Static
**Added in:** `@astrojs/vercel@3.3.0`

When enabled, an [Image Service](https://docs.astro.build/en/reference/image-service-reference/) powered by the Vercel Image Optimization API will be automatically configured and used in production. In development, a built-in Squoosh-based service will be used instead.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),
});
```

```astro
---
import { Image } from 'astro:assets';
import astroLogo from '../assets/logo.png';
---

<!-- This component -->
<Image src={astroLogo} alt="My super logo!" />

<!-- will become the following HTML -->
<img
  src="/_vercel/image?url=_astro/logo.hash.png&w=...&q=..."
  alt="My super logo!"
  loading="lazy"
  decoding="async"
  width="..."
  height="..."
/>
```

### includeFiles

**Type:** `string[]`<br>
**Available for:** Edge, Serverless

Use this property to force files to be bundled with your function. This is helpful when you notice missing files.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    includeFiles: ['./my-data.json'],
  }),
});
```

> **Note**
> When building for the Edge, all the dependencies get bundled in a single file to save space. **No extra file will be bundled**. So, if you _need_ some file inside the function, you have to specify it in `includeFiles`.

### excludeFiles

**Type:** `string[]`<br>
**Available for:** Serverless

Use this property to exclude any files from the bundling process that would otherwise be included.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    excludeFiles: ['./src/some_big_file.jpg'],
  }),
});
```

### Per-page functions

The Vercel adapter builds to a single function by default. Astro 2.7 added support for splitting your build into separate entry points per page. If you use this configuration the Vercel adapter will generate a separate function for each page. This can help reduce the size of each function so they are only bundling code used on that page.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  build: {
    split: true,
  },
});
```

### Vercel Middleware

You can use Vercel middleware to intercept a request and redirect before sending a response. Vercel middleware can run for Edge, SSR, and Static deployments. You don't need to install `@vercel/edge` to write middleware, but you do need to install it to use features such as geolocation. For more information see [Vercel’s middleware documentation](https://vercel.com/docs/concepts/functions/edge-middleware).

1. Add a `middleware.js` file to the root of your project:

   ```js
   // middleware.js
   export const config = {
     // Only run the middleware on the admin route
     matcher: '/admin',
   };

   export default function middleware(request) {
     const url = new URL(request.url);
     // You can retrieve IP location or cookies here.
     if (url.pathname === '/admin') {
       url.pathname = '/';
     }
     return Response.redirect(url);
   }
   ```

1. While developing locally, you can run `vercel dev` to run middleware. In production, Vercel will handle this for you.

<!-- prettier-ignore -->
> **Warning**
> **Trying to rewrite?** Currently rewriting a request with middleware only works for static files.

## Troubleshooting

**A few known complex packages (example: [puppeteer](https://github.com/puppeteer/puppeteer)) do not support bundling and therefore will not work properly with this adapter.** By default, Vercel doesn't include npm installed files & packages from your project's `./node_modules` folder. To address this, the `@astrojs/vercel` adapter automatically bundles your final build output using `esbuild`.

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
