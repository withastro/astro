# @astrojs/netlify

Deploy your server-side rendered (SSR) Astro app to [Netlify](https://www.netlify.com/).

Use this adapter in your Astro configuration file, alongside a valid deployment URL:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
	adapter: netlify(),
  // Where your Netlify app will be deployed.
  // Feel free to use a local URL (i.e. http://localhost:8080)
  // to test local builds via the netlify CLI
  site: 'https://my-production-url.netlify.app',
});
```

After you build your site the `netlify/` folder will contain [Netlify Functions](https://docs.netlify.com/functions/overview/) in the `netlify/functions/` folder.

Now you can deploy!

```shell
netlify deploy
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
