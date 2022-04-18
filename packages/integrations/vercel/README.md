# @astrojs/vercel

Deploy your server-side rendered (SSR) Astro app to [Vercel](https://www.vercel.com/).

Use this integration in your Astro configuration file:

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
	adapter: vercel()
});
```

After you build your site the `.output/` folder will contain your server-side rendered app. Since this feature is still in beta, you'll **need to add this Enviroment Variable to your Vercel project**: `ENABLE_FILE_SYSTEM_API=1`. [Learn how to set enviroment variables](https://vercel.com/docs/concepts/projects/environment-variables).

Now you can deploy!

```shell
vercel
```
