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
netlify deploy
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

We build to a `netlify` directory at the base of your project. To change this, use the `dist` option:

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
