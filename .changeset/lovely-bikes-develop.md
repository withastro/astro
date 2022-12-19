---
'@astrojs/mdx': minor
---

Inject heading IDs after user rehype plugins run.

This allows users to override Astro’s default ID generation algorithm with a standard tool like `rehype-slug` or any alternative. It is also consistent with the order of execution in Markdown files in Astro.

⚠️ BREAKING CHANGE ⚠️

If you are using a rehype plugin that depends on heading IDs injected by Astro, the IDs will no longer be available when your plugin runs by default.

To restore the previous behavior, set `collectHeadings: 'before'` in the MDX integration options:

    ```js
    // astro.config.mjs
    import mdx from '@astrojs/mdx';

    export default {
      integrations: [
        mdx({ collectHeadings: 'before' }),
      ],
    }
    ```
