---
'@astrojs/mdx': minor
---

Inject heading IDs after user rehype plugins run.

This allows users to override Astro’s default ID generation algorithm with a standard tool like `rehype-slug` or any alternative.

⚠️ BREAKING CHANGE ⚠️

If you are using a rehype plugin that depends on heading IDs injected by Astro, the IDs will no longer be available when your plugin runs.

Instead, add your own ID injection plugin like [`rehype-slug`](https://github.com/rehypejs/rehype-slug):

1. Install the plugin: `npm i rehype slug`

2. Add it to your rehype plugins in the `mdx()` integration options:

    ```js
    // astro.config.mjs
    import mdx from '@astrojs/mdx';

    export default {
      integrations: [
        mdx({
          rehypePlugins: [
            'rehype-slug',
            myPluginThatDependsOnHeadingIDs,
          ],
        }),
      ],
    }
    ```
