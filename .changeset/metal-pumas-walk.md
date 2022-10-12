---
'@astrojs/node': major
---

# Standalone mode for the Node.js adapter

New in `@astrojs/node` is support for __standalone mode__. With standalone mode you can start your production server without needing to write any server JavaScript yourself. The server starts simply by running the script like so:

```shell
node ./dist/server/entry.mjs
```

To enable standalone mode, set the new `mode` to `'standalone'` option in your Astro config:

```js
import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: nodejs({
    mode: 'standalone'
  })
});
```

See the @astrojs/node documentation to learn all of the options available in standalone mode.

## Breaking change

This is a semver major change because the new `mode` option is required. Existing @astrojs/node users who are using their own HTTP server framework such as Express can upgrade by setting the `mode` option to `'middleware'` in order to build to a middleware mode, which is the same behavior and API as before.

```js
import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: nodejs({
    mode: 'middleware'
  })
});
```
