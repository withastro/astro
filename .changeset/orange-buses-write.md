---
'astro': patch
---

Adds a new `getFontData()` method to retrieve lower-level font family data programmatically when using the experimental Fonts API

The `getFontData()` helper function from `astro:assets` provides access to font family data for use outside of Astro. This can then be used in an [API Route](/en/guides/endpoints/#server-endpoints-api-routes) or to generate your own meta tags.

```ts
import { getFontData } from 'astro:assets'

const data = getFontData('--font-roboto')
```

For example, `getFontData()` can get the font buffer from the URL when using [satori](https://github.com/vercel/satori) to generate OpenGraph images:

```tsx
// src/pages/og.png.ts

import type{ APIRoute } from "astro"
import { getFontData } from "astro:assets"
import satori from "satori"

export const GET: APIRoute = (context) => {
  const data = getFontData("--font-roboto")

  const svg = await satori(
    <div style={{ color: "black" }}>hello, world</div>,
    {
      width: 600,
      height: 400,
      fonts: [
        {
          name: "Roboto",
          data: await fetch(new URL(data[0].src[0].url, context.url.origin)).then(res => res.arrayBuffer()),
          weight: 400,
          style: "normal",
        },
      ],
    },
  )

  // ...
}
```

See the [experimental Fonts API documentation](https://docs.astro.build/en/reference/experimental-flags/fonts/#accessing-font-data-programmatically) for more information.
