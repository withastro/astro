---
'@astrojs/markdoc': minor
'astro': minor
---

The SVG import feature introduced behind a flag in [v5.0.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#500) is no longer experimental and is available for general use.

This feature allows you to import SVG files directly into your Astro project as components and inline them into your HTML.

To use this feature, import an SVG file in your Astro project, passing any common SVG attributes to the imported component.

```astro
---
import Logo from './path/to/svg/file.svg';
---
<Logo />
```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    svg: true,
-  }
})
```

Additionally, a few features that were available during the experimental stage were removed in a previous release. Please see [the v5.6.0 changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#560) for details if you have not yet already updated your project code for the experimental feature accordingly.

If you have been waiting for stabilization before using the SVG Components feature, you can now do so.

Please see the [SVG Components guide in docs](https://docs.astro.build/en/guides/images/#svg-components) for more about this feature.
