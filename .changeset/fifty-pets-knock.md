---
'@astrojs/netlify': patch
---

Defaults to not injecting environment variables from Netlify

`@astrojs/netlify@6.5.0` introduced a potentially breaking change that enabled injecting Netlify environment variables in `astro dev` by default. This could lead to unexpected behavior in Astro projects that do not expect these variables to be present. This now defaults to disabled, and users can enable it by setting the `devFeatures.environmentVariables` option in their Astro config. 

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [netlify()],
  devFeatures: {
    environmentVariables: true,
  },
});
```

You can also set `devFeatures` to `true` to enable or disable all dev features, including environment variables and images:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
export default defineConfig({
  integrations: [netlify()],
  devFeatures: true,
});
```
