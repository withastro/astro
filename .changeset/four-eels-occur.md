---
'@astrojs/netlify': minor
---

Switches out the adapter's implementation for Netlify's [vite plugin](https://www.npmjs.com/package/@netlify/vite-plugin).

Now running `astro dev` with the Netlify adapter [enabled](https://docs.astro.build/en/guides/integrations-guide/netlify/#installation) will populate your environment with the variables from your linked Netlify site.

Enables use of [blobs](https://docs.netlify.com/storage/blobs/overview/) and the Netlify [context object](https://docs.astro.build/en/guides/integrations-guide/netlify/#accessing-edge-context-from-your-site) in during development.
