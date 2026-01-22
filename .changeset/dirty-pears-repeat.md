---
'astro': patch
---

Adds a new `getFontBuffer()` method to retrieve font file buffers when using the experimental Fonts API

The `getFontData()` helper function from `astro:assets` was introduced in 5.14.0 to provide access to font family data for use outside of Astro. One of the goals of this API was to be able to retrieve buffers using URLs.

However, it turned out to be impactical and even impossible during prerendering.

Astro now exports a new `getFontBuffer()` helper function from `astro:assets` to retrieve font file buffers from URL returned by `getFontData()`. For example, when using [satori](https://github.com/vercel/satori) to generate OpenGraph images:

```diff
// src/pages/og.png.ts

import type{ APIRoute } from "astro"
-import { getFontData } from "astro:assets"
+import { getFontData, getFontBuffer } from "astro:assets"
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
-          data: await fetch(new URL(data[0].src[0].url, context.url.origin)).then(res => res.arrayBuffer()),
+          data: await getFontBuffer(data[0].src[0].url),
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
