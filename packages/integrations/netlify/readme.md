# @astrojs/netlify

Deploy your server-side rendered (SSR) Astro app to [Netlify](https://www.netlify.com/).

Use this adapter in your Astro configuration file:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
	adapter: netlify()
});
```

After you build your site the `dist/` folder will contain [Netlify Functions](https://docs.netlify.com/functions/overview/) in the `dist/functions/` folder. Update your `netlify.toml`:

```toml
[functions]
  directory = "dist/functions"
```

Now you can deploy!

```shell
netlify deploy
```
