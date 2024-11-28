---
'@astrojs/vercel': major
'astro': major
---

Remove support for functionPerRoute

This change removes support for the `functionPerRoute` option both in Astro and `@astrojs/vercel`.

This option made it so that each route got built as separate entrypoints so that they could be loaded as separate functions. The hope was that by doing this it would decrease the size of each function. However in practice routes use most of the same code, and increases in function size limitations made the potential upsides less important.

Additionally there are downsides to functionPerRoute, such as hitting limits on the number of functions per project. The feature also never worked with some Astro features like i18n domains and request rewriting.

Given this, the feature has been removed from Astro.
