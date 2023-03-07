---
'astro': patch
'@astrojs/markdoc': patch
'@astrojs/mdx': patch
---

Introduce the (experimental) `@astrojs/markdoc` integration. This unlocks Markdoc inside your Content Collections, bringing support for Astro and UI components in your content. This also improves Astro core internals to make Content Collections extensible to more file types in the future.

You can install this integration using the `astro add` command:

```
astro add markdoc
```

[Read the `@astrojs/markdoc` documentation](https://docs.astro.build/en/guides/integrations-guide/markdoc/) for usage instructions, and browse the [new `with-markdoc` starter](https://astro.new/with-markdoc) to try for yourself.
