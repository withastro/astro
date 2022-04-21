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

When you build your project, Astro will know to use the `.output` folder format that Vercel expects.

```
astro build
```

That's it! You can deploy by CLI (`vercel deploy`) or by connecting your new repo in the [Vercel Dashboard](https://vercel.com/).

## Requirements

**Vercel's [File System API](https://vercel.com/docs/file-system-api/v2) must be enabled.** You must enable it yourself by setting the environment variable: `ENABLE_FILE_SYSTEM_API=1`. 

```js
// vercel.json
{
  "build": {
    "env": {
      "ENABLE_FILE_SYSTEM_API": "1"
    }
  }
}
```

[Learn more about setting enviroment variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables).


## Limitations

**A few known complex packages (example: [puppeteer](https://github.com/puppeteer/puppeteer)) do not support bundling and therefore will not work properly with this adapter.** By default, Vercel doesn't include npm installed files & packages from your project's `./node_modules` folder. To address this, the `@astrojs/vercel` adapter automatically bundles your final build output using `esbuild`.
