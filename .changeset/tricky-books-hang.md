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
