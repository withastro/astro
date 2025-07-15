---
'@astrojs/netlify': patch
---

Adds a new `devFeatures` configuration option to control the behavior introduced in `@astrojs/netlify@6.5.0` which introduced Netlify production features into the dev environment.

Additionally, no longer injects environment variables from Netlify by default when running `astro dev`.

`@astrojs/netlify@6.5.0` introduced a potentially breaking change that enabled injecting Netlify environment variables in `astro dev` by default. This could lead to unexpected behavior in Astro projects that do not expect these variables to be present. This now defaults to disabled, and users can enable it by setting the `devFeatures.environmentVariables` option in their Astro config.

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  adapter: netlify({
    devFeatures: {
      environmentVariables: true,
    },
  }),
});
```

You can also set `devFeatures` to `true` to enable or disable all dev features, including environment variables and images:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
export default defineConfig({
  adapter: netlify({
    devFeatures: true,
  }),
});
```
