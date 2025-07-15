---
'@astrojs/netlify': patch
---

Adds a new `devFeatures` configuration option to control some of the behaviors introduced in `@astrojs/netlify@6.5.0` which introduced Netlify production features into the dev environment.

You can now individually configure whether or not to populate your environment with the variables from your linked Netlify site (now disabled by default), and use a local version of the Netlify Image CDN for images (still enabled by default) when running `astro dev`.

Additionally, the adapter no longer injects environment variables from Netlify by default when running `astro dev`.

`@astrojs/netlify@6.5.0` introduced a potentially breaking change that enabled injecting Netlify environment variables in `astro dev` by default. This could lead to unexpected behavior in Astro projects that do not expect these variables to be present. This now defaults to disabled, and users can enable it by setting the `devFeatures.environmentVariables` option in their Astro config. Similarly, you can use `devFeatures.images` to disable using the Netlify Image CDN locally if needed:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  adapter: netlify({
    devFeatures: {
      environmentVariables: true,
      images: false
    },
  }),
});
```

You can also set `devFeatures` to `true` or `false` to enable or disable all configurable dev features:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
export default defineConfig({
  adapter: netlify({
    devFeatures: true,
  }),
});
```
