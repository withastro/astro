---
'astro': minor
---

Adds a new `experimental_getFontFileURL()` method to resolve font file URLs when using the Fonts API

The `fontData` object exported from `astro:assets` was introduced to provide low-level access to font family data for advanced usage. One of the goals of this API was to be able to resolve buffers using URLs. However, it turned out to be impractical, especially during prerendering.

Astro now exports a new `experimental_getFontFileURL()` helper function from `astro:assets` to resolve font file URLs from `fontData`. For example, when using [satori](https://github.com/vercel/satori) to generate Open Graph images:

```diff
// src/pages/og.png.ts

import type { APIRoute } from "astro";
-import { fontData } from "astro:assets";
+import { fontData, experimental_getFontFileURL } from "astro:assets";
-import { outDir } from "astro:config/server";
-import { readFile } from "node:fs/promises";
import satori from "satori";
import { html } from "satori-html";
import sharp from "sharp";

export const GET: APIRoute = async (context) => {
  const fontPath = fontData["--font-roboto"][0]?.src[0]?.url;

  if (fontPath === undefined) {
    throw new Error("Cannot find the font path.");
  }

-  const data = import.meta.env.DEV
-    ? await fetch(new URL(fontPath, context.url.origin)).then(async (res) => res.arrayBuffer())
-    : await readFile(new URL(`.${fontPath}`, outDir));
+  const url = experimental_getFontFileURL(fontPath, context.url);
+  const data = await fetch(url).then((res) => res.arrayBuffer());

  const svg = await satori(
    html`<div style="color: black;">hello, world</div>`,
    {
      width: 600,
      height: 400,
      fonts: [
        {
          name: "Roboto",
          data,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );

  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(600, 400)
    .png()
    .toBuffer();

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
```

See the [Fonts API documentation](https://docs.astro.build/en/guides/fonts/#accessing-font-data-programmatically) for more information.
