---
'astro': minor
---

Adds a new build-in font provider `npm` to access fonts installed as NPM packages

You can now add web fonts specified in your `package.json` through Astro's type-safe Fonts API.  The `npm` font provider allows you to add fonts either from locally installed packages in `node_modules` or from a CDN.

Set `fontProviders.npm()` as your fonts provider along with the required `name` and `cssVariable` values, and add `options` as needed:

```js
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
    experimental: {
        fonts: [
            {
                name: 'Roboto',
                provider: fontProviders.npm(),
                cssVariable: '--font-roboto',
            },
        ],
    },
});
```

See the [NPM font provider reference documentation](https://v6.docs.astro.build/en/reference/font-provider-reference/#npm) for more details.
