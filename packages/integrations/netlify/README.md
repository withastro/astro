# @astrojs/netlify

This adapter allows Astro to deploy your SSR site to [Netlify](https://www.netlify.com/).

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

First, install the `@astrojs/netlify` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/netlify
```

Then, install this adapter in your `astro.config.*` file using the `adapter` property. Note: there are two different adapters, one for Netlify Functions and one for Edge Functions. See [Edge Functions](#edge-functions) below on importing the latter.

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
	adapter: netlify(),
});
```

### Edge Functions

Netlify has two serverless platforms, Netlify Functions and Netlify Edge Functions. With Edge Functions your code is distributed closer to your users, lowering latency. You can use Edge Functions by changing the import in your astro configuration file:

```diff
import { defineConfig } from 'astro/config';
- import netlify from '@astrojs/netlify/functions';
+ import netlify from '@astrojs/netlify/edge-functions';

export default defineConfig({
	adapter: netlify(),
});
```
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

<details>
  <summary><strong>dist</strong></summary>

We build to the `dist` directory at the base of your project. To change this, use the `dist` option:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  adapter: netlify({
    dist: new URL('./dist/', import.meta.url)
  })
});
```

And then point to the dist in your `netlify.toml`:

```toml
[functions]
directory = "dist/functions"
```

</details>

<details>
  <summary>
    <strong>binaryMediaTypes</strong>
  </summary>

> This option is only needed for the Functions adapter and is not needed for Edge Functions.

Netlify Functions requires binary data in the `body` to be base64 encoded. The `@astrojs/netlify/functions` adapter handles this automatically based on the `Content-Type` header.

We check for common mime types for audio, image, and video files. To include specific mime types that should be treated as binary data, include the `binaryMediaTypes` option with a list of binary mime types.

```js
import fs from 'node:fs';

export function get() {
  const buffer = fs.readFileSync('../image.jpg');

  // Return the buffer directly, @astrojs/netlify will base64 encode the body
  return new Response(buffer, {
    status: 200,
    headers: {
      'content-type': 'image/jpeg'
    }
  });
}
```
</details>

## Examples

- The [Astro Netlify Edge Starter](https://github.com/sarahetter/astro-netlify-edge-starter) provides an example and a guide in the README.

- [Browse Astro Netlify projects on GitHub](https://github.com/search?q=%22%40astrojs%2Fnetlify%22+filename%3Apackage.json&type=Code) for more examples!

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

