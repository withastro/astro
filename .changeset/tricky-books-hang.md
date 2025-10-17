---
'astro': patch
---

Adds the option to specify in the `preload` directive which weights, styles, or subsets to preload for a given font family when using the experimental Fonts API:

```astro
---
import { Font } from 'astro:assets';
---
<Font
  cssVariable="--font-roboto"
  preload={[
    { subset: 'latin', style: 'normal' },
    { weight: '400' },
  ]}
/>
```

Variable weight font files will be preloaded if any weight within its range is requested. For example, a font file for font weight `100 900` will be included when `400` is specified in a `preload` object.
