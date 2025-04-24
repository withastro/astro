---
'astro': patch
---

Renames experimental responsive image layout option from "responsive" to "constrained"

:warning: **BREAKING CHANGE FOR EXPERIMENTAL RESPONSIVE IMAGES ONLY** :warning:

The layout option called `"responsive"` is renamed to `"constrained"` to better reflect its behavior.

The previous name was causing confusion, because it is also the name of the feature. The `responsive` layout option is specifically for images that are displayed at the requested size, unless they do not fit the width of their container, at which point they would be scaled down to fit. They do not get scaled beyond the intrinsic size of the source image, or the `width` prop if provided. 

It became clear from user feedback that many people (understandably) thought that they needed to set `layout` to `responsive` if they wanted to use responsive images. They then struggled with overriding styles to make the image scale up for full-width hero images, for example, when they should have been using `full-width` layout. Renaming the layout to `constrained` should make it clearer that this layout is for when you want to constrain the maximum size of the image, but allow it to scale-down.

### Upgrading

If you set a default `image.experimentalLayout` in your `astro.config.mjs`, or set it on a per-image basis using the `layout` prop, you will need to change all occurences to `constrained`:

```diff lang="ts"
// astro.config.mjs
export default {
  image: {
-    experimentalLayout: 'responsive',
+    experimentalLayout: 'constrained',
  },
}
```

```diff lang="astro"
// src/pages/index.astro
---
import { Image } from 'astro:assets';
---
- <Image src="/image.jpg" layout="responsive" />
+ <Image src="/image.jpg" layout="constrained" />
```

Please [give feedback on the RFC](https://github.com/withastro/roadmap/pull/1051) if you have any questions or comments about the responsive images API.
