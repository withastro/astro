# @astrojs/layer0

Deploy your server-side rendered (SSR) Astro app to [Layer0](https://www.layer0.co/).

Use this integration in your Astro configuration file:

```js
import { defineConfig } from 'astro/config';
import layer0 from '@astrojs/layer0';

export default defineConfig({
	adapter: layer0()
});
```

When you build your project, Astro will know to use the `.output` folder format that Layer0 expects.

```
astro build
```

That's it! You can deploy by CLI using `layer0 deploy`.
