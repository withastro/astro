# @astrojs/vercel

Deploy your server-side rendered (SSR) Astro app to [Vercel](https://www.vercel.com/).

Use this integration in your Astro configuration file:

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
	adapter: vercel()
});
```

When you build your project, Astro will know to use the `.vercel/output` folder format that Vercel expects.

## Deploying

You can deploy by CLI (`vercel deploy`) or by connecting your new repo in the [Vercel Dashboard](https://vercel.com/). Alternatively, you can create a production build locally:

```sh
ENABLE_VC_BUILD=1 astro build
vercel deploy --prebuilt
```

## Requirements

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

## Targets

You can deploy to different targes:

- `edge`: SSR inside a [Edge function](https://vercel.com/docs/concepts/functions/edge-functions).
- `serverless`: SSR inside a [Node.js function](https://vercel.com/docs/concepts/functions/serverless-functions).
- `static`: generates a static website following Vercel's output formats, redirects, etc.

> **Note**: deploying to the Edge has [its limitations](https://vercel.com/docs/concepts/functions/edge-functions#known-limitations) — they can't be more than 1 MB in size and they don't support native Node.js APIs, among others.

You can change where to target by changing the import:

```js
import vercel from '@astrojs/vercel/edge';
import vercel from '@astrojs/vercel/serverless';
import vercel from '@astrojs/vercel/static';
```

### Node.js version

When deploying to `serverless` you can choose what version of Node.js you want to target: `12.x`, `14.x` or `16.x` (default).

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
	adapter: vercel({ nodeVersion: '14.x' })
});
```

## Limitations

**A few known complex packages (example: [puppeteer](https://github.com/puppeteer/puppeteer)) do not support bundling and therefore will not work properly with this adapter.** By default, Vercel doesn't include npm installed files & packages from your project's `./node_modules` folder. To address this, the `@astrojs/vercel` adapter automatically bundles your final build output using `esbuild`.
