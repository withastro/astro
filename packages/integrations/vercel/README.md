# @astrojs/vercel

This adapter allows Astro to deploy your SSR site to [Vercel](https://www.vercel.com/).

- <strong>[Why Astro Vercel](#why-astro-vercel)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Vercel

If you're using Astro as a static site builder—its behavior out of the box—you don't need an adapter.

If you wish to [use server-side rendering (SSR)](https://docs.astro.build/en/guides/server-side-rendering/), Astro requires an adapter that matches your deployment runtime.

[Vercel](https://www.netlify.com/) is a deployment platform that allows you to host your site by connecting directly to your GitHub repository.  This adapter enhances the Astro build process to prepare your project for deployment through Vercel.

## Installation

First, install the `@astrojs/vercel` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/vercel
```

Then, install this adapter in your `astro.config.*` file using the `adapter` property (note the import from `@astrojs/vercel/serverless` - see [targets](#targets)).

 __astro.config.mjs__ 

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
	adapter: vercel()
});
```

### Targets

You can deploy to different targes:

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

📚 **[Read the full deployment guide here.](https://docs.astro.build/en/guides/deploy/vercel)**

You can deploy by CLI (`vercel deploy`) or by connecting your new repo in the [Vercel Dashboard](https://vercel.com/). Alternatively, you can create a production build locally:

```sh
ENABLE_VC_BUILD=1 astro build
vercel deploy --prebuilt
```

**Vercel's [Build Output API](https://vercel.com/docs/build-output-api/v3) must be enabled.** You must enable it yourself by setting the environment variable: `ENABLE_VC_BUILD=1`. 

```js
// vercel.json
{
  "build": {
    "env": {
      "ENABLE_VC_BUILD": "1"
    }
  }
}
```

[Learn more about setting enviroment variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables).

## Configuration

This adapter does not expose any configuration options.

## Examples

## Troubleshooting

**A few known complex packages (example: [puppeteer](https://github.com/puppeteer/puppeteer)) do not support bundling and therefore will not work properly with this adapter.** By default, Vercel doesn't include npm installed files & packages from your project's `./node_modules` folder. To address this, the `@astrojs/vercel` adapter automatically bundles your final build output using `esbuild`.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
