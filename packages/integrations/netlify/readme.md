# @astrojs/netlify

Deploy your server-side rendered (SSR) Astro app to [Netlify](https://www.netlify.com/).

Use this adapter in your Astro configuration file:

```js
import { defineConfig } from 'astro/config';
import { netlifyFunctions } from '@astrojs/netlify';

export default defineConfig({
	adapter: netlifyFunctions()
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
