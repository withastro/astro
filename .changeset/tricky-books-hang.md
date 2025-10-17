---
'astro': patch
---

Allows specifying what weight (and optionally style) to preload for a given font family when using the experimental fonts API:

```astro
---
import { Font } from 'astro:assets'
---

<Font cssVariable='--font-test' preload={[{ weight: 400 }]} />
```

If a candidate is a file with a variable weight, it will be preloaded if the passed weight is within range. For example, a font file for font weight `100 900` will be included since `400` is within that range.
