---
'astro': minor
'@astrojs/cloudflare': minor
'@astrojs/deno': minor
'@astrojs/image': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'@astrojs/sitemap': minor
'@astrojs/vercel': minor
---

New `output` configuration option

This change introduces a new "output target" configuration option (`output`). Setting the output target lets you decide the format of your final build, either:

* `"static"` (default): A static site. Your final build will be a collection of static assets (HTML, CSS, JS) that you can deploy to any static site host.
* `"server"`: A dynamic server application. Your final build will be an application that will run in a hosted server environment, generating HTML dynamically for different requests.

If `output` is omitted from your config, the default value `"static"` will be used.

When using the `"server"` output target, you must also include a runtime adapter via the `adapter` configuration. An adapter will *adapt* your final build to run on the deployed platform of your choice (Netlify, Vercel, Node.js, Deno, etc).

To migrate: No action is required for most users. If you currently define an `adapter`, you will need to also add `output: 'server'` to your config file to make it explicit that you are building a server. Here is an example of what that change would look like for someone deploying to Netlify:

```diff
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  adapter: netlify(),
+ output: 'server',
});
```