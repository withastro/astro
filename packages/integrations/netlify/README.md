# @astrojs/netlify

Deploy your server-side rendered (SSR) Astro app to [Netlify](https://www.netlify.com/).

Use this adapter in your Astro configuration file, alongside a valid deployment URL:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
	adapter: netlify(),
});
```

After you build your site the `netlify/` folder will contain [Netlify Functions](https://docs.netlify.com/functions/overview/) in the `netlify/functions/` folder.

Now you can deploy!

```shell
netlify deploy --build
```

## Edge Functions

Netlify has two serverless platforms, Netlify Functions and Netlify Edge Functions. With Edge Functions your code is distributed closer to your users, lowering latency. You can use Edge Functions by changing the import in your astro configuration file:

```diff
import { defineConfig } from 'astro/config';
- import netlify from '@astrojs/netlify/functions';
+ import netlify from '@astrojs/netlify/edge-functions';

export default defineConfig({
	adapter: netlify(),
});
```

## Configuration

### dist

We build to a `dist` directory at the base of your project. To change this, use the `dist` option:

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

### binaryMediaTypes

> This option is only needed for the Functions adapter and is not needed for Edge Functions.

Netlify Functions sending binary data in the `body` need to be base64 encoded. The `@astrojs/netlify/functions` adapter handles this automatically based on the `Content-Type` header.

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
