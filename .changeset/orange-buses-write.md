---
'astro': patch
---

Adds a new API to allow retrieving font files URLs when using the experimental fonts API

You can now use the `getFontData()` function from `astro:assets` to have access to data for the provided CSS variable:

```ts
import { getFontData } from 'astro:assets'

const data = getFontData('--font-roboto')
```

This is useful when you need font file outside of Astro, eg. to generate images using [satori](https://github.com/vercel/satori).
